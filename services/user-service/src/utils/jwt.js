//token

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "planly-dev-secret-change-in-prod";
const EXPIRES = "7d"; //7 dias p expir

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
