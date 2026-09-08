type HttpStatusInfo = {
  type: string;
  message: string;
  success: boolean;
};

export const HttpStatusCodes: Record<number, HttpStatusInfo> = {
  // 1xx - Informational
  100: {
    type: "Continue",
    success: false,
    message:
      "The server has received the request headers, and the client should proceed to send the request body.",
  },
  101: {
    type: "Switching Protocols", // (e.g., switching to WebSocket)
    success: false,
    message: "The server is switching protocols as requested by the client.",
  },
  103: {
    type: "Early Hints",
    success: false,
    message:
      "Used to return some response headers before the final HTTP message.",
  },

  // 2xx - Success
  200: {
    type: "OK",
    success: true,
    message: "The request succeeded.",
  },
  201: {
    type: "Created", // (e.g., after a POST request)
    success: true,
    message:
      "The request succeeded, and a new resource was created as a result.",
  },
  202: {
    type: "Accepted",
    success: true,
    message:
      "The request was accepted for processing, but the processing is not complete.",
  },

  204: {
    type: "No Content", // (common after a DELETE request)
    success: true,
    message:
      "The server successfully processed the request but is not returning any content.",
  },

  // 3xx - Redirection
  301: {
    type: "Moved Permanently",
    success: false,
    message:
      "The URL of the requested resource has been changed permanently. The new URL is given in the response. Browsers/caches will remember this and use the new URL next time.",
  },
  302: {
    type: "Found",
    success: false,
    message:
      "The URL of the requested resource has been changed temporarily. The new URL is given in the response. Browsers will use the original URL for future requests.",
  },
  304: {
    type: "Not Modified",
    success: false,
    message:
      "Used for caching purposes. Tells the client that the response has not been modified, so the client can continue to use the same cached version.",
  },

  // 4xx - Client Errors
  400: {
    type: "Bad Request", // (e.g., malformed request syntax)
    success: false,
    message:
      "The server cannot process the request due to something that is perceived to be a client error.",
  },
  401: {
    type: "Unauthorized",
    success: false,
    message:
      "The request requires user authentication. The client must authenticate itself to get the requested response.",
  },
  403: {
    type: "Forbidden",
    success: false,
    message:
      "The client does not have access rights to the content. Unlike 401, the client's identity is known, but they are not permitted to access the resource.",
  },
  404: {
    type: "Not Found",
    success: false,
    message: "The server cannot find the requested resource.",
  },
  405: {
    type: "Method Not Allowed",
    success: false,
    message:
      "The request method (e.g., GET, POST) is known by the server but is not supported for the target resource.",
  },
  408: {
    type: "Request Timeout",
    success: false,
    message: "The server would like to shut down this unused connection.",
  },
  429: {
    type: "Too Many Requests", // (rate limiting)
    success: false,
    message: "The user has sent too many requests in a given amount of time.",
  },

  // 5xx - Server Errors
  500: {
    type: "Internal Server Error",
    success: false,
    message:
      "A generic server error. The server encountered a situation it doesn't know how to handle.",
  },
  501: {
    type: "Not Implemented",
    success: false,
    message:
      "The server does not support the functionality required to fulfill the request.",
  },
  502: {
    type: "Bad Gateway",
    success: false,
    message:
      "The server, while acting as a gateway or proxy, received an invalid response from an upstream server.",
  },
  503: {
    success: false,
    type: "Service Unavailable", // (common causes are a server that is down for maintenance or is overloaded)
    message: "The server is not ready to handle the request.",
  },
  504: {
    type: "Gateway Timeout",
    success: false,
    message:
      "The server, while acting as a gateway or proxy, did not get a response in time from the upstream server that it needed to access to complete the request.",
  },
};
