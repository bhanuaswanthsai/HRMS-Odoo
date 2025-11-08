import { EmployeeModel } from '../models/Employee.js';
import { UserModel } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { validationResult } from 'express-validator';

export const getAllEmployees = async (req, res) => {
  try {
    const { department, status, search, limit, offset } = req.query;
    const filters = {
      department,
      status,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const employees = await EmployeeModel.findAll(filters);
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, role, employee_id, department, designation, joining_date, salary_structure, profile_data } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      role: role || 'employee',
      profile_data: profile_data || {},
    });

    // Create employee
    const employee = await EmployeeModel.create({
      user_id: user.id,
      employee_id,
      department,
      designation,
      joining_date,
      salary_structure: salary_structure || {},
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { ...employee, user },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await EmployeeModel.update(id, updateData);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await EmployeeModel.delete(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

