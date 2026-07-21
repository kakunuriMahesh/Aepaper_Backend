const AuditLog = require('../models/AuditLog');

const trackActivity = (actionType, collectionTarget) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      res.removeListener('finish', logActivity);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity();
      }
      return originalJson(body);
    };

    const logActivity = async () => {
      try {
        const targetId =
          req.params.id || (body && body.data && body.data._id) || null;

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

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity();
      }
    });

    next();
  };
};

module.exports = trackActivity;
