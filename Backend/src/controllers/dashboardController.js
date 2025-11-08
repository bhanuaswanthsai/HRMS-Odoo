import pool from '../config/database.js';
import { EmployeeModel } from '../models/Employee.js';
import { AttendanceModel } from '../models/Attendance.js';
import { LeaveModel } from '../models/Leave.js';
import { PayrollModel } from '../models/Payroll.js';

export const getAdminDashboard = async (req, res) => {
  try {
    // Total employees
    const employees = await EmployeeModel.findAll();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    // Pending leave requests
    const pendingLeaves = await LeaveModel.getPendingLeaves();

    // Current month attendance
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const attendanceReport = await AttendanceModel.getMonthlyReport(currentMonth, currentYear);
    const presentCount = attendanceReport.filter(a => a.status === 'present').length;
    const absentCount = attendanceReport.filter(a => a.status === 'absent').length;
    const attendanceRate = attendanceReport.length > 0 
      ? (presentCount / attendanceReport.length) * 100 
      : 0;

    // Department distribution
    const departmentCount = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });

    // Recent payroll summary
    const payrollReport = await PayrollModel.getMonthlyReport(currentMonth, currentYear);
    const totalPayroll = payrollReport.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        pendingLeaves: pendingLeaves.length,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        presentCount,
        absentCount,
        departmentDistribution: departmentCount,
        totalPayroll,
        recentActivities: {
          pendingLeaves: pendingLeaves.slice(0, 5),
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await EmployeeModel.findByUserId(userId);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Get attendance stats
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const attendanceLogs = await AttendanceModel.getEmployeeLogs(employee.id, {
      start_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      end_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`,
    });

    const presentDays = attendanceLogs.filter(a => a.status === 'present').length;
    const absentDays = attendanceLogs.filter(a => a.status === 'absent').length;
    const leaveDays = attendanceLogs.filter(a => a.status === 'leave').length;

    // Get leave balance
    const query = 'SELECT * FROM leave_balance WHERE employee_id = $1';
    const balanceResult = await pool.query(query, [employee.id]);
    const leaveBalance = balanceResult.rows[0] || {
      casual_leave: 12,
      sick_leave: 10,
      earned_leave: 15,
      paid_leave: 5,
    };

    // Get recent leaves
    const recentLeaves = await LeaveModel.getEmployeeLeaves(employee.id);
    const recentLeavesList = recentLeaves.slice(0, 5);

    // Get current month payroll
    const payroll = await PayrollModel.findByEmployeeAndPeriod(
      employee.id,
      currentMonth,
      currentYear
    );

    res.json({
      success: true,
      data: {
        employee: {
          employee_id: employee.employee_id,
          department: employee.department,
          designation: employee.designation,
        },
        attendance: {
          presentDays,
          absentDays,
          leaveDays,
          totalDays: attendanceLogs.length,
        },
        leaveBalance,
        recentLeaves: recentLeavesList,
        currentPayroll: payroll,
      },
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

