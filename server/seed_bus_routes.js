import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from './models/Bus.js';

dotenv.config();

const newBuses = [
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 1',
        source: 'Thrissur',
        destination: 'Thriprayar',
        sourceTime: '10:00',
        destinationTime: '11:31',
        price: 30,
        busType: 'Normal',
        stops: [
            { name: 'peringottukara', time: '10:20', ticketPrice: 5 },
            { name: 'pazhuvil', time: '10:45', ticketPrice: 12 },
            { name: 'chirakkal', time: '11:05', ticketPrice: 15 },
            { name: 'cherpu', time: '11:30', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.5276,
            longitude: 76.2144,
            currentStop: 'Thrissur',
            nextStop: 'peringottukara',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    },
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 2',
        source: 'Thrissur',
        destination: 'Thriprayar',
        sourceTime: '12:00',
        destinationTime: '13:15',
        price: 30,
        busType: 'Limited Stop',
        stops: [
            { name: 'peringottukara', time: '12:16', ticketPrice: 5 },
            { name: 'pazhuvil', time: '12:37', ticketPrice: 12 },
            { name: 'chirakkal', time: '12:53', ticketPrice: 15 },
            { name: 'cherpu', time: '13:14', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.5276,
            longitude: 76.2144,
            currentStop: 'Thrissur',
            nextStop: 'peringottukara',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    },
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 3',
        source: 'Kunnamkulam',
        destination: 'Thrissur',
        sourceTime: '17:00',
        destinationTime: '18:00',
        price: 30,
        busType: 'Normal',
        stops: [
            { name: 'choondal', time: '17:10', ticketPrice: 5 },
            { name: 'kechery', time: '17:24', ticketPrice: 12 },
            { name: 'sobha', time: '17:35', ticketPrice: 15 },
            { name: 'poonkunnam', time: '17:50', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.6479,
            longitude: 76.0712,
            currentStop: 'Kunnamkulam',
            nextStop: 'choondal',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    },
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 4',
        source: 'Kunnamkulam',
        destination: 'Thrissur',
        sourceTime: '10:00',
        destinationTime: '11:00',
        price: 30,
        busType: 'Limited Stop',
        stops: [
            { name: 'choondal', time: '10:10', ticketPrice: 5 },
            { name: 'kechery', time: '10:24', ticketPrice: 12 },
            { name: 'sobha', time: '10:35', ticketPrice: 15 },
            { name: 'poonkunnam', time: '10:50', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.6479,
            longitude: 76.0712,
            currentStop: 'Kunnamkulam',
            nextStop: 'choondal',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    },
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 5',
        source: 'Irinjalakuda',
        destination: 'Kodungaloor',
        sourceTime: '15:00',
        destinationTime: '16:02',
        price: 30,
        busType: 'Normal',
        stops: [
            { name: 'oorakam', time: '15:10', ticketPrice: 5 },
            { name: 'perumbilisery', time: '15:25', ticketPrice: 12 },
            { name: 'vellani', time: '15:35', ticketPrice: 15 },
            { name: 'katoor', time: '15:52', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.3424,
            longitude: 76.2162,
            currentStop: 'Irinjalakuda',
            nextStop: 'oorakam',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    },
    {
        state: 'Kerala',
        district: 'Thrissur',
        busName: 'Bus 6',
        source: 'Irinjalakuda',
        destination: 'Kodungaloor',
        sourceTime: '18:00',
        destinationTime: '19:00',
        price: 30,
        busType: 'Limited Stop',
        stops: [
            { name: 'oorakam', time: '18:10', ticketPrice: 5 },
            { name: 'perumbilisery', time: '18:25', ticketPrice: 12 },
            { name: 'vellani', time: '18:35', ticketPrice: 15 },
            { name: 'katoor', time: '18:50', ticketPrice: 25 }
        ],
        liveTracking: {
            latitude: 10.3424,
            longitude: 76.2162,
            currentStop: 'Irinjalakuda',
            nextStop: 'oorakam',
            activeShareCount: 0,
            lastUpdated: new Date()
        }
    }
];

const seedBuses = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected.');

        // Verify if these buses already exist to avoid duplicate inserts
        for (const busInfo of newBuses) {
            const existing = await Bus.findOne({ 
                busName: busInfo.busName, 
                source: busInfo.source, 
                destination: busInfo.destination,
                sourceTime: busInfo.sourceTime 
            });

            if (existing) {
                console.log(`⚠️ ${busInfo.busName} (${busInfo.source} -> ${busInfo.destination} at ${busInfo.sourceTime}) already exists. Skipping.`);
            } else {
                const created = await Bus.create(busInfo);
                console.log(`✅ Inserted successfully: ${created.busName} | ${created.source} -> ${created.destination} (${created.busType})`);
            }
        }

        console.log('🚀 Seeding Completed Successfully.');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

seedBuses();
