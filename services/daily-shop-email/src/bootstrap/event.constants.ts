export interface EventType<T = any> {
  payload: T;
}
export const EVENTS = {
  LOGIN_INITIATE: "login:initiate",
};
