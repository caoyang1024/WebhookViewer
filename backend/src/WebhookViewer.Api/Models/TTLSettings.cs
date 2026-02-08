namespace WebhookViewer.Api.Models;

public class TTLSettings
{
    public int VerboseMinutes { get; set; } = 60;         // 1 hour
    public int DebugMinutes { get; set; } = 360;          // 6 hours
    public int InformationMinutes { get; set; } = 1440;   // 24 hours
    public int WarningMinutes { get; set; } = 10080;      // 7 days
    public int ErrorMinutes { get; set; } = 43200;        // 30 days
    public int FatalMinutes { get; set; }                  // 0 = forever
}
