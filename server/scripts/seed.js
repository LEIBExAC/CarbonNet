/*
  Seed script for CarbonNet
  - Creates Institution
  - Creates users: superadmin, admin, user, regularUser + sample users
  - Generates sample activities across last 90 days
  - Creates challenges with participants and progress

  Usage:
    node scripts/seed.js            # seed or update
    node scripts/seed.js --reset    # drop key collections then seed
*/

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

const Institution = require("../models/institution");
const User = require("../models/user");
const Activity = require("../models/activity");
const Challenge = require("../models/challenge");
const { calculateEmissions } = require("../utility/emissionCalculator");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Carbon";

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);
}

async function reset() {
  console.log(
    "Resetting collections (users, institutions, activities, challenges)..."
  );
  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Activity.deleteMany({}),
    Challenge.deleteMany({}),
  ]);
}

function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function ensureInstitution() {
  const code = "CNU";
  let inst = await Institution.findOne({ code });
  if (!inst) {
    inst = await Institution.create({
      name: "CarbonNet University",
      code,
      type: "university",
      contactInfo: { email: "info@carbonnet-univ.test" },
      adminEmail: "admin@carbonnet.test",
      departments: [
        {
          name: "Computer Science",
          code: "CS",
          contactEmail: "cs@carbonnet.test",
        },
        {
          name: "Sustainability",
          code: "SUS",
          contactEmail: "sus@carbonnet.test",
        },
      ],
      population: { students: 1500, faculty: 120, staff: 80, total: 1700 },
      settings: { allowSelfRegistration: true },
      setupCompleted: true,
    });
    console.log("Created institution:", inst.name);
  } else {
    console.log("Using existing institution:", inst.name);
  }
  return inst;
}

async function ensureUsers(institutionId) {
  const commonPassword = "Password123!";

  const defs = [
    {
      name: "Super Admin",
      email: "superadmin@carbonnet.test",
      role: "superadmin",
      userType: "admin",
    },
    {
      name: "Admin User",
      email: "admin@carbonnet.test",
      role: "admin",
      userType: "admin",
    },
    {
      name: "Student User",
      email: "user@carbonnet.test",
      role: "user",
      userType: "student",
    },
    {
      name: "Regular User",
      email: "regular@carbonnet.test",
      role: "user",
      userType: "regularUser",
    },
  ];

  const extraNames = [
    "Alex",
    "Jordan",
    "Taylor",
    "Sam",
    "Riley",
    "Charlie",
    "Morgan",
    "Casey",
  ];
  for (let i = 0; i < 6; i++) {
    defs.push({
      name: `${pick(extraNames)} Sample ${i + 1}`,
      email: `sample${i + 1}@carbonnet.test`,
      role: "user",
      userType: pick(["student", "faculty", "staff", "regularUser"]),
    });
  }

  const users = [];
  for (const def of defs) {
    let u = await User.findOne({ email: def.email }).select("+password");
    if (!u) {
      u = new User({
        ...def,
        institutionId,
        status: "active",
        emailVerified: true,
        password: commonPassword,
        totalPoints: Math.floor(randBetween(0, 500)),
      });
      await u.save();
      console.log("Created user:", def.email);
    } else {
      u.name = def.name;
      u.role = def.role;
      u.userType = def.userType;
      u.institutionId = institutionId;
      u.status = "active";
      u.emailVerified = true;
      if (!u.password) u.password = commonPassword; // in case of legacy
      await u.save();
      console.log("Updated user:", def.email);
    }
    users.push(u);
  }

  // Mark admin as institution admin
  const admin = users.find((u) => u.role === "admin");
  if (admin) {
    await Institution.updateOne(
      { _id: institutionId },
      { $addToSet: { admins: admin._id } }
    );
  }

  return { users, commonPassword };
}

function buildRandomActivity(user) {
  const categories = [
    "transportation",
    "electricity",
    "food",
    "waste",
    "water",
  ];
  const category = pick(categories);
  const daysAgo = Math.floor(randBetween(0, 90));
  const activityDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const base = {
    userId: user._id,
    institutionId: user.institutionId,
    category,
    activityDate,
    dataSource: "api",
  };

  switch (category) {
    case "transportation": {
      const mode = pick(["car", "bus", "train", "metro", "bike", "rickshaw"]);
      const fuelType =
        mode === "car" ? pick(["petrol", "diesel", "cng", "electric"]) : "none";
      const distance = Math.round(randBetween(2, 40));
      return {
        ...base,
        transportation: {
          mode,
          fuelType,
          distance,
          passengers: pick([1, 1, 1, 2, 3]),
        },
        description: `${mode} commute`,
      };
    }
    case "electricity": {
      const consumption = Math.round(randBetween(1, 12)) * 10; // kWh slabs
      const source = pick(["grid", "solar", "wind"]);
      return {
        ...base,
        electricity: {
          consumption,
          source,
          appliance: pick(["AC", "Fan", "Lights", "PC"]),
        },
        description: "Appliance usage",
      };
    }
    case "food": {
      const dietType = pick(["veg", "non-veg", "vegan"]);
      const quantity = Math.round(randBetween(1, 3));
      return {
        ...base,
        food: {
          mealType: pick(["breakfast", "lunch", "dinner"]),
          dietType,
          quantity,
          foodWaste: Math.round(randBetween(0, 2)) / 10,
        },
        description: "Meal",
      };
    }
    case "waste": {
      const type = pick(["general", "plastic", "paper", "food"]);
      const quantity = Math.round(randBetween(1, 8)) / 2; // kg
      return {
        ...base,
        waste: { type, quantity, recycled: pick([true, false]) },
        description: "Waste disposal",
      };
    }
    case "water": {
      const consumption = Math.round(randBetween(50, 300));
      return {
        ...base,
        water: {
          consumption,
          usage: pick(["drinking", "washing", "cleaning", "gardening"]),
        },
        description: "Water use",
      };
    }
    default:
      return { ...base, quantity: 1, unit: "kg", description: "Other" };
  }
}

async function seedActivities(users) {
  console.log("Generating sample activities (this may take a moment)...");

  const perUser = 60; // activities per user ~ last 90 days
  let created = 0;
  for (const user of users) {
    const docs = [];
    for (let i = 0; i < perUser; i++) {
      const raw = buildRandomActivity(user);
      const emission = await calculateEmissions(raw);
      docs.push({
        ...raw,
        carbonEmission: emission.total,
        emissionFactorUsed: emission.factorUsed,
      });
    }
    await Activity.insertMany(docs);
    created += docs.length;
    console.log(`  - ${user.email}: ${docs.length}`);
  }
  console.log("Activities created:", created);
}

async function seedChallenges(users, institutionId, createdBy) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const defs = [
    {
      title: "Reduce Commute Emissions",
      description:
        "Carpool, bike, or take public transport to reduce commute emissions.",
      category: "transportation",
      type: "reduction",
      difficulty: "medium",
      points: 200,
      target: { metric: "emissions", value: 50, unit: "kg" },
      scope: "individual",
    },
    {
      title: "Electricity Saver Month",
      description: "Lower your home or office electricity consumption.",
      category: "electricity",
      type: "streak",
      difficulty: "easy",
      points: 150,
      target: { metric: "kwh", value: 200, unit: "kWh" },
      scope: "institution",
    },
  ];

  const created = [];
  for (const d of defs) {
    let c = await Challenge.findOne({
      title: d.title,
      "duration.startDate": { $lte: end },
      "duration.endDate": { $gte: start },
    });
    if (!c) {
      c = await Challenge.create({
        ...d,
        duration: { startDate: start, endDate: end },
        institutionId,
        rewards: [
          { rank: 1, points: 300 },
          { rank: 2, points: 200 },
          { rank: 3, points: 100 },
        ],
        createdBy,
        featured: true,
      });
      console.log("Created challenge:", c.title);
    } else {
      console.log("Using existing challenge:", c.title);
    }
    created.push(c);
  }

  // Add participants and progress to first challenge to showcase leaderboard
  const participants = users.slice(0, 6);
  for (const ch of created) {
    for (const u of participants) {
      const exists = ch.participants.some((p) => p.userId.equals(u._id));
      if (!exists) {
        ch.participants.push({
          userId: u._id,
          progress: Math.round(randBetween(10, 100)),
          completed: false,
        });
      }
    }
    // Mark a couple as completed
    if (ch.participants.length > 2) {
      ch.participants[0].completed = true;
      ch.participants[0].completedAt = new Date();
      ch.participants[1].completed = true;
      ch.participants[1].completedAt = new Date();
    }
    await ch.save();
  }
}

async function main() {
  try {
    await connect();
    if (process.argv.includes("--reset")) {
      await reset();
    }

    const inst = await ensureInstitution();
    const { users, commonPassword } = await ensureUsers(inst._id);

    // Generate activities and challenges
    await seedActivities(users);
    const admin = users.find((u) => u.role === "admin") || users[0];
    await seedChallenges(users, inst._id, admin._id);

    console.log("\nSeed complete. Log in with:");
    console.log("  Super Admin:", "superadmin@carbonnet.test", commonPassword);
    console.log("  Admin:      ", "admin@carbonnet.test", commonPassword);
    console.log("  User:       ", "user@carbonnet.test", commonPassword);
    console.log("  Regular:    ", "regular@carbonnet.test", commonPassword);
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
