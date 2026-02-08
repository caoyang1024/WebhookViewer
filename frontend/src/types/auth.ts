export interface UserPermissions {
  deleteSingle: boolean;
  deleteBulk: boolean;
  manageSettings: boolean;
  manageUsers: boolean;
}

export interface UserInfo {
  username: string;
  permissions: UserPermissions;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  permissions: UserPermissions;
}

export interface UpdateUserRequest {
  password?: string;
  permissions?: UserPermissions;
}
