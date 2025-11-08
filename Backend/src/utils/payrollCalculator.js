export const calculatePayroll = (salaryStructure, attendanceDays, totalDays, unpaidLeaves = 0) => {
  const basic = parseFloat(salaryStructure.basic || 0);
  const hra = parseFloat(salaryStructure.hra || 0);
  const conveyance = parseFloat(salaryStructure.conveyance || 0);
  const medical = parseFloat(salaryStructure.medical || 0);

  // Calculate allowances
  const allowances = {
    hra,
    conveyance,
    medical,
  };

  // Calculate gross salary
  const grossSalary = basic + hra + conveyance + medical;

  // Calculate deductions
  const pfDeduction = (basic * 12) / 100; // 12% of basic
  const professionalTax = 200; // Fixed amount
  const unpaidLeaveDeduction = (grossSalary / totalDays) * unpaidLeaves;

  const deductions = {
    pf: pfDeduction,
    professional_tax: professionalTax,
    unpaid_leaves: unpaidLeaveDeduction,
  };

  // Calculate net salary
  const totalDeductions = pfDeduction + professionalTax + unpaidLeaveDeduction;
  const netSalary = grossSalary - totalDeductions;

  return {
    basic_salary: basic,
    allowances,
    deductions,
    gross_salary: grossSalary,
    net_salary: Math.max(0, netSalary), // Ensure non-negative
    attendance_days: attendanceDays,
    total_days: totalDays,
    unpaid_leaves: unpaidLeaves,
  };
};

