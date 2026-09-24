import * as service from "./auth.service.js";
import { deleteSession, publicUser } from "../../shared/auth.js";

export const register = async (req, res) =>
  res.status(201).json({ user: await service.register(req.body, res) });
export const login = async (req, res) =>
  res.json({ user: await service.login(req.body, res) });
export const me = (req, res) => res.json({ user: publicUser(req.user) });
export const logout = async (req, res) => {
  await deleteSession(req);
  res
    .clearCookie("ustatop_session", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
    .json({ ok: true });
};
