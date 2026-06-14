/* 
 * Database Seeder Utility
 * Automatically populates default fintech profiles, wallets, and logs if MySQL is empty
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const FraudAlert = require('../models/FraudAlert');

const seedData = async () => {
    try {
        // 1. Verify if users exist
        const userCount = await User.count();
        if (userCount > 0) {
            console.log('Database already contains records. Bypassing seeding.');
            return;
        }

        console.log('⌛ Database is empty. Seeding starting default records...');

        // 2. Create Default Users
        const alex = await User.create({
            fullName: 'Alex Mercer',
            email: 'alex.mercer@cyberpay.ai',
            phone: '+1 (555) 019-2834',
            password: 'password123',
            role: 'user'
        });

        const sarah = await User.create({
            fullName: 'Sarah Jenkins',
            email: 'sarah.jenkins@cyberpay.ai',
            phone: '+1 (555) 019-9020',
            password: 'password123',
            role: 'user'
        });

        const john = await User.create({
            fullName: 'John Doe',
            email: 'john.doe@cyberpay.ai',
            phone: '+1 (555) 019-1111',
            password: 'password123',
            role: 'user'
        });

        const mia = await User.create({
            fullName: 'Mia Wang',
            email: 'mia.wang@cyberpay.ai',
            phone: '+1 (555) 019-2222',
            password: 'password123',
            role: 'user'
        });

        const david = await User.create({
            fullName: 'David Miller',
            email: 'david.miller@cyberpay.ai',
            phone: '+1 (555) 019-3333',
            password: 'password123',
            role: 'user'
        });

        const robert = await User.create({
            fullName: 'Robert Chen',
            email: 'robert.chen@cyberpay.ai',
            phone: '+1 (555) 019-4444',
            password: 'password123',
            role: 'user'
        });

        const emily = await User.create({
            fullName: 'Emily Watson',
            email: 'emily.watson@cyberpay.ai',
            phone: '+1 (555) 019-5555',
            password: 'password123',
            role: 'user'
        });

        const prashu = await User.create({
            fullName: 'Prashu Yadav',
            email: 'prashuyadav360@gmail.com',
            phone: '+91 (555) 019-9999',
            password: 'passowrd123',
            role: 'user'
        });

        console.log('✔ Users seeded.');

        // 3. Create Wallets
        const alexWallet = await Wallet.create({
            userId: alex.id,
            balance: 5420.50,
            totalSent: 1240.00,
            totalReceived: 3150.00
        });

        const sarahWallet = await Wallet.create({
            userId: sarah.id,
            balance: 1500.00,
            totalSent: 300.00,
            totalReceived: 450.00
        });

        const johnWallet = await Wallet.create({
            userId: john.id,
            balance: 2100.00,
            totalSent: 0.00,
            totalReceived: 0.00
        });

        const miaWallet = await Wallet.create({
            userId: mia.id,
            balance: 3400.00,
            totalSent: 0.00,
            totalReceived: 0.00
        });

        const davidWallet = await Wallet.create({
            userId: david.id,
            balance: 890.00,
            totalSent: 0.00,
            totalReceived: 0.00
        });

        const robertWallet = await Wallet.create({
            userId: robert.id,
            balance: 3500.00,
            totalSent: 1250.00,
            totalReceived: 0.00
        });

        const emilyWallet = await Wallet.create({
            userId: emily.id,
            balance: 6250.00,
            totalSent: 0.00,
            totalReceived: 1200.00
        });

        const prashuWallet = await Wallet.create({
            userId: prashu.id,
            balance: 4800.00,
            totalSent: 1550.00,
            totalReceived: 800.00
        });

        console.log('✔ Wallets seeded.');

        // 4. Create Transactions
        const t1 = await Transaction.create({
            senderId: alex.id,
            receiverId: null,
            amount: 15.49,
            transactionType: 'send-money',
            description: 'Netflix subscription renewal',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        });

        const t2 = await Transaction.create({
            senderId: sarah.id,
            receiverId: alex.id,
            amount: 450.00,
            transactionType: 'send-money',
            description: 'Split for weekend trip expenses',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });

        const t3 = await Transaction.create({
            senderId: alex.id,
            receiverId: null,
            amount: 6.75,
            transactionType: 'send-money',
            description: 'Starbucks mobile checkout',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });

        const t4 = await Transaction.create({
            senderId: alex.id,
            receiverId: null,
            amount: 124.50,
            transactionType: 'send-money',
            description: 'Target Store Shopping',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        });

        const t5 = await Transaction.create({
            senderId: alex.id,
            receiverId: null,
            amount: 85.20,
            transactionType: 'bill-payment',
            description: 'Electricity bill payment ConEd',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        });

        const t6 = await Transaction.create({
            senderId: alex.id,
            receiverId: null,
            amount: 2500.00,
            transactionType: 'send-money',
            description: '[BLOCKED] Wire transfer to external node',
            status: 'Failed',
            fraudRisk: 'HIGH_RISK',
            createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
        });

        // Suspicious transaction history for Robert
        const t7 = await Transaction.create({
            senderId: robert.id,
            receiverId: emily.id,
            amount: 1200.00,
            transactionType: 'send-money',
            description: 'Design consultant services split',
            status: 'Success',
            fraudRisk: 'SUSPICIOUS',
            createdAt: new Date(Date.now() - 3 * 3600 * 1000) // 3 hours ago
        });

        // Fraud transaction history for Emily (Failed / Blocked)
        const t8 = await Transaction.create({
            senderId: emily.id,
            receiverId: null,
            amount: 4500.00,
            transactionType: 'send-money',
            description: '[BLOCKED] High volume wire to unregistered wallet',
            status: 'Failed',
            fraudRisk: 'HIGH_RISK',
            createdAt: new Date(Date.now() - 1 * 3600 * 1000) // 1 hour ago
        });

        // Safe transaction history
        const t9 = await Transaction.create({
            senderId: robert.id,
            receiverId: sarah.id,
            amount: 50.00,
            transactionType: 'send-money',
            description: 'Lunch split expense sharing',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 5 * 3600 * 1000) // 5 hours ago
        });

        // Prashu Yadav safe transaction
        const t10 = await Transaction.create({
            senderId: prashu.id,
            receiverId: sarah.id,
            amount: 50.00,
            transactionType: 'send-money',
            description: 'Coffee share checkout',
            status: 'Success',
            fraudRisk: 'SAFE',
            createdAt: new Date(Date.now() - 4 * 3600 * 1000) // 4 hours ago
        });

        // Prashu Yadav suspicious transaction
        const t11 = await Transaction.create({
            senderId: prashu.id,
            receiverId: john.id,
            amount: 1400.00,
            transactionType: 'send-money',
            description: 'Rent share split invoice',
            status: 'Success',
            fraudRisk: 'SUSPICIOUS',
            createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
        });

        // Prashu Yadav fraud blocked transaction (Failed)
        const t12 = await Transaction.create({
            senderId: prashu.id,
            receiverId: null,
            amount: 3500.00,
            transactionType: 'send-money',
            description: '[BLOCKED] Instant wire transfer to target exchange wallet',
            status: 'Failed',
            fraudRisk: 'HIGH_RISK',
            createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
        });

        console.log('✔ Transactions seeded.');

        // 5. Create Fraud Alerts
        await FraudAlert.create({
            transactionId: t6.id,
            riskScore: 95,
            alertType: 'HIGH_AMOUNT',
            message: 'Blocked by AI Shield: Wire transfer suspicious anomalies. Location distance mismatch and anomalous liquidation.'
        });

        await FraudAlert.create({
            transactionId: t7.id,
            riskScore: 55,
            alertType: 'ELEVATED_AMOUNT',
            message: 'Flagged by AI Shield: Transaction amount ($1200.00) exceeds standard user parameters. Marked as Suspicious.'
        });

        await FraudAlert.create({
            transactionId: t8.id,
            riskScore: 94,
            alertType: 'HIGH_AMOUNT',
            message: 'Blocked by AI Shield: Transaction amount ($4500.00) triggers High-Risk rating rules.'
        });

        await FraudAlert.create({
            transactionId: t11.id,
            riskScore: 60,
            alertType: 'ELEVATED_AMOUNT',
            message: 'Flagged by AI Shield: Transaction amount ($1400.00) exceeds standard user boundaries. Marked as Suspicious.'
        });

        await FraudAlert.create({
            transactionId: t12.id,
            riskScore: 88,
            alertType: 'HIGH_AMOUNT',
            message: 'Blocked by AI Shield: Transaction amount ($3500.00) flagged for high risk of fraud.'
        });

        console.log('✔ Fraud alerts seeded.');

        // 6. Create Bills
        await Bill.create({
            userId: alex.id,
            billType: 'Electricity',
            amount: 85.20,
            status: 'PAID',
            paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        });

        await Bill.create({
            userId: alex.id,
            billType: 'Mobile Recharge',
            amount: 29.99,
            status: 'PAID',
            paidAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
        });

        await Bill.create({
            userId: alex.id,
            billType: 'Electricity',
            amount: 85.20,
            status: 'UNPAID',
            paidAt: null
        });

        console.log('✔ Bills seeded.');
        console.log('🎉 Database seeding sequence completed successfully!');

    } catch (error) {
        console.error('✘ Seeding Database failed:', error.message);
    }
};

module.exports = seedData;
