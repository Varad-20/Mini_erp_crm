import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/authMiddleware";
import { prisma } from "../config/prisma";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const duplicateEmail = await prisma.user.findFirst({
      where: { email, id: { not: id } },
    });

    if (duplicateEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const updateData: any = {
      name,
      email,
      role,
    };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (req.user?.userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user. They might have related records.",
    });
  }
};
