export interface EventType<T = any> {
  payload: T;
}
export const EVENTS = {
  LOGIN_INITIATE: "login:initiate",
  AFTER_LOGIN_USER_CREATE: "afterLoginUser:create",

  LOGIN_VERIFY: "login:verify",
  FORGOT_PASSWORD: "forgot:password",
  CREATE_USER: "user:created",
  SERVICE_ERROR: "service_error",
};
