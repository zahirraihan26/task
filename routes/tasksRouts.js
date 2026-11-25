const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");

const router = express.Router();
const validStatuses = ["pending", "in-progress", "done"];


router.post("/", async (req, res, next) => {
  try {
    const { title, status, dueDate, userId } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty title is required"
      });
    }

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid userId is required"
      });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending, in-progress, or done"
      });
    }

    if (dueDate !== undefined && Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        success: false,
        message: "dueDate must be a valid date"
      });
    }

    const task = await Task.create({ title, status, dueDate, userId });
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

// GET /api/tasks?page=1&limit=10&status=done - list tasks
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const { status } = req.query;

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter"
      });
    }

    const filter = status ? { status } : {};
    const total = await Task.countDocuments(filter);
    const data = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      total,
      page,
      limit,
      data
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
