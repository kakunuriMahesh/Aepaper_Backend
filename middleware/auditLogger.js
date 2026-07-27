const AuditLog = require('../models/AuditLog');

const trackActivity = (actionType, collectionTarget) => {
  return (req, res, next) => {
    let responseBody = null;
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      responseBody = body;
      return originalJson(body);
    };

    const logActivity = async () => {
      try {
        const targetId =
          req.params.id || (responseBody && responseBody.data && responseBody.data._id) || null;

        await AuditLog.create({
          publisherId: req.user?.publisherId || null,
          userId: req.user?.id || null,
          userEmail: req.user?.email || '',
          userRole: req.user?.role || '',
          action: actionType,
          targetId: targetId,
          targetCollection: collectionTarget,
          ipAddress: req.ip || req.connection?.remoteAddress || '',
          userAgent: req.get('user-agent') || '',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Audit log error:', error.message);
      }
    };

    const onFinish = () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity();
      }
    };

    res.on('finish', onFinish);

    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
      res.removeListener('finish', onFinish);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity();
      }
      return originalEnd(...args);
    };

    next();
  };
};

module.exports = trackActivity;
