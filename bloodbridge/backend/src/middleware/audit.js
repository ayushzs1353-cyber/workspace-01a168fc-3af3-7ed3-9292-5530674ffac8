import { AuditLog } from "../models/index.js";

export function audit(action, entity) {
  return async (req, res, next) => {
    const original = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode < 400 && req.user) await AuditLog.create({ actor: req.user._id, action, entity, entityId: body?.organization?._id || body?.user?._id || body?.request?._id, metadata: { method: req.method, path: req.path } });
      return original(body);
    };
    next();
  };
}
