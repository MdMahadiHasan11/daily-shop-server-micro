// import { ISession } from "../../api/modules/auth/auth.type";
// import sessionService from "../services/session.service";
// import jwtHelper from "./jwt.helper";

// export async function refreshUserSession(
//   req: any,
//   updatedUser: any,
// ): Promise<void> {
//   const accessToken =
//     req.cookies?.accessToken ||
//     (req.headers.authorization?.startsWith("Bearer ")
//       ? req.headers.authorization.split(" ")[1]
//       : undefined);

//   if (!accessToken) return;

//   try {
//     const decoded = await jwtHelper.verifyAccessToken<{ jti: string }>(
//       accessToken,
//     );

//     if (decoded?.jti) {
//       const session = (await sessionService.validateSession(
//         decoded.jti,
//       )) as ISession;

//       if (session?.valid) {
//         const updatedSession: ISession = {
//           ...session,
//           role: updatedUser.role ?? session.role,
//           email: updatedUser.email ?? session.email,
//           phoneNumber: updatedUser.phoneNumber ?? session.phoneNumber,
//           valid: true,
//         };

//         await sessionService.updateSession(decoded.jti, updatedSession);
//       }
//     }
//   } catch (err) {
//     console.log("Session refresh utility failed:", err);
//   }
// }
