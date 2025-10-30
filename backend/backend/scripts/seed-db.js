/*
 * Seed the database with 15 devices and at least 1000 telemetry records.
 * Allowed device types: plug, thermostat, light
 * Allowed rooms: kitchen, living room, bedroom, bathroom, garage, other
 * Collections used: devices, telemetries (Mongoose defaults)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const ALLOWED_TYPES = ['plug', 'thermostat', 'light'];
const ALLOWED_ROOMS = [
  'kitchen',
  'living room',
  'bedroom',
  'bathroom',
  'garage',
  'other',
];

const TYPE_TO_CATEGORY = {
  plug: 'power',
  light: 'lighting',
  thermostat: 'heating',
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateDevices() {
  const devices = [];
  for (let i = 1; i <= 15; i++) {
    const type = sample(ALLOWED_TYPES);
    const room = sample(ALLOWED_ROOMS);
    const category = TYPE_TO_CATEGORY[type];
    const deviceId = `dev-${i.toString().padStart(3, '0')}`;
    const name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`;

    let ratedWattage = undefined;
    if (type === 'plug') ratedWattage = randomInt(100, 2000);
    if (type === 'light') ratedWattage = randomInt(5, 60);
    if (type === 'thermostat') ratedWattage = undefined; // typically negligible draw

    devices.push({
      deviceId,
      name,
      type,
      category,
      room,
      ...(ratedWattage ? { ratedWattage } : {}),
    });
  }
  return devices;
}

function generateTelemetryForDevice(device, countPerDevice) {
  const telemetry = [];
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < countPerDevice; i++) {
    // Spread timestamps over last 7 days
    const ts = new Date(now - Math.random() * sevenDaysMs);
    let value;
    if (device.type === 'plug') {
      // power draw in watts
      value = Math.max(
        0,
        Math.round((device.ratedWattage || 1500) * (0.1 + Math.random() * 0.9)),
      );
    } else if (device.type === 'light') {
      // brightness or wattage usage
      value = Math.max(
        0,
        Math.round((device.ratedWattage || 10) * Math.random()),
      );
    } else if (device.type === 'thermostat') {
      // temperature in Celsius
      value = Math.round((18 + Math.random() * 8) * 10) / 10; // 18.0 - 26.0
    } else {
      value = Math.round(Math.random() * 100);
    }

    telemetry.push({
      deviceId: device.deviceId,
      category: device.category,
      value,
      status: Math.random() > 0.1, // 90% on/true
      timestamp: ts,
    });
  }
  return telemetry;
}

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error(
      'MONGO_URI is not set. Please configure it in your environment.',
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const devicesCol = db.collection('devices');
    const telemetryCol = db.collection('telemetries');

    // Clean target collections to ensure deterministic seed
    await devicesCol.deleteMany({});
    await telemetryCol.deleteMany({});

    // Insert devices
    const devices = generateDevices();
    await devicesCol.insertMany(devices, { ordered: true });
    console.log(`Inserted ${devices.length} devices.`);

    // Generate telemetry: at least 1000 total
    const countPerDevice = 100; // 15 * 100 = 1500 >= 1000
    const telemetryDocs = [];
    for (const device of devices) {
      telemetryDocs.push(...generateTelemetryForDevice(device, countPerDevice));
    }

    await telemetryCol.insertMany(telemetryDocs, { ordered: false });
    console.log(`Inserted ${telemetryDocs.length} telemetry records.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

seed();
