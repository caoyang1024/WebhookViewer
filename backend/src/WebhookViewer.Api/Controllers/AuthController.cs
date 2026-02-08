using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebhookViewer.Api.Models;
using WebhookViewer.Api.Services;

namespace WebhookViewer.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserStore _userStore;

    public AuthController(IUserStore userStore)
    {
        _userStore = userStore;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserInfo>> Login([FromBody] LoginRequest request)
    {
        var user = await _userStore.GetAsync(request.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid username or password" });

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username),
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

        return Ok(UserInfo.FromUser(user));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserInfo>> Me()
    {
        var username = User.Identity?.Name;
        if (username == null) return Unauthorized();

        var user = await _userStore.GetAsync(username);
        if (user == null) return Unauthorized();

        return Ok(UserInfo.FromUser(user));
    }

    [HttpGet("users")]
    [Authorize(Policy = "ManageUsers")]
    public async Task<ActionResult<List<UserInfo>>> ListUsers()
    {
        var users = await _userStore.ListAsync();
        return Ok(users.Select(UserInfo.FromUser).ToList());
    }

    [HttpPost("users")]
    [Authorize(Policy = "ManageUsers")]
    public async Task<ActionResult<UserInfo>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Username and password are required" });

        var existing = await _userStore.GetAsync(request.Username);
        if (existing != null)
            return Conflict(new { error = "User already exists" });

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = await _userStore.CreateAsync(request.Username, hash, request.Permissions);
        return Ok(UserInfo.FromUser(user));
    }

    [HttpPut("users/{username}")]
    [Authorize(Policy = "ManageUsers")]
    public async Task<ActionResult<UserInfo>> UpdateUser(string username, [FromBody] UpdateUserRequest request)
    {
        string? hash = null;
        if (!string.IsNullOrWhiteSpace(request.Password))
            hash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = await _userStore.UpdateAsync(username, hash, request.Permissions);
        if (user == null) return NotFound();

        return Ok(UserInfo.FromUser(user));
    }

    [HttpDelete("users/{username}")]
    [Authorize(Policy = "ManageUsers")]
    public async Task<IActionResult> DeleteUser(string username)
    {
        var currentUser = User.Identity?.Name;
        if (string.Equals(username, currentUser, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Cannot delete your own account" });

        var deleted = await _userStore.DeleteAsync(username);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
