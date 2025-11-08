import { calculatePayroll } from '../../../src/utils/payrollCalculator.js';

describe('Payroll Calculator', () => {
  const baseSalaryStructure = {
    basic: 50000,
    hra: 15000,
    conveyance: 2000,
    medical: 2000,
  };

  describe('calculatePayroll', () => {
    it('should calculate payroll correctly for full attendance', () => {
      const result = calculatePayroll(baseSalaryStructure, 30, 30, 0);
      
      expect(result.basic_salary).toBe(50000);
      expect(result.gross_salary).toBe(69000); // 50000 + 15000 + 2000 + 2000
      expect(result.deductions.pf).toBe(6000); // 12% of basic
      expect(result.deductions.professional_tax).toBe(200);
      expect(result.deductions.unpaid_leaves).toBe(0);
      expect(result.net_salary).toBe(62800); // 69000 - 6000 - 200
    });

    it('should deduct for unpaid leaves', () => {
      const result = calculatePayroll(baseSalaryStructure, 28, 30, 2);
      
      expect(result.unpaid_leaves).toBe(2);
      expect(result.deductions.unpaid_leaves).toBeGreaterThan(0);
      expect(result.net_salary).toBeLessThan(62800);
    });

    it('should handle zero basic salary', () => {
      const result = calculatePayroll(
        { basic: 0, hra: 0, conveyance: 0, medical: 0 },
        30,
        30,
        0
      );
      
      expect(result.basic_salary).toBe(0);
      expect(result.gross_salary).toBe(0);
      expect(result.net_salary).toBe(0);
    });

    it('should ensure net salary is non-negative', () => {
      const result = calculatePayroll(
        { basic: 1000, hra: 0, conveyance: 0, medical: 0 },
        1,
        30,
        29
      );
      
      expect(result.net_salary).toBeGreaterThanOrEqual(0);
    });

    it('should calculate PF as 12% of basic', () => {
      const result = calculatePayroll(
        { basic: 100000, hra: 0, conveyance: 0, medical: 0 },
        30,
        30,
        0
      );
      
      expect(result.deductions.pf).toBe(12000);
    });

    it('should include all allowances in gross salary', () => {
      const result = calculatePayroll(baseSalaryStructure, 30, 30, 0);
      
      expect(result.allowances.hra).toBe(15000);
      expect(result.allowances.conveyance).toBe(2000);
      expect(result.allowances.medical).toBe(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing salary components', () => {
      const result = calculatePayroll(
        { basic: 50000 },
        30,
        30,
        0
      );
      
      expect(result.gross_salary).toBe(50000);
      expect(result.net_salary).toBeDefined();
    });

    it('should handle very high unpaid leaves', () => {
      const result = calculatePayroll(baseSalaryStructure, 1, 30, 29);
      
      expect(result.net_salary).toBeGreaterThanOrEqual(0);
      expect(result.deductions.unpaid_leaves).toBeGreaterThan(0);
    });
  });
});

