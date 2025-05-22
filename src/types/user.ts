export interface UpdateUsernameRequest {
  newUsername: string;
}

export interface UpdateUsernameResponse {
  success: boolean;
  message: string;
  data?: {
    username: string;
  };
}
