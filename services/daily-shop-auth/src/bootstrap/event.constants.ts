export interface EventType<T = any> {
  payload: T;
}
export const EVENTS = {
  LOGIN_VERIFY: "login:verify",
  LOGIN_INITIATE: "login:initiate",
  FORGOT_PASSWORD: "forgot:password",
  CREATE_USER: "user:created",
  SERVICE_ERROR: "service_error",
};
