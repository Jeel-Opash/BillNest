import DashboardService from "../services/dashboard.service.js";




export const getDashboardStats = async (req, res) => {
  try {
    const stats = await DashboardService.getStats(req.user.organizationId);
    
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Dashboard Stats Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};