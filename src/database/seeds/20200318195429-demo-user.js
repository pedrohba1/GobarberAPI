module.exports = {
    up: queryInterface => {
        return queryInterface.bulkInsert(
            'users',
            [
                {
                    name: 'demo User',
                    email: 'demo8@gmail.com',
                    password_hash:
                        '$2a$08$RYCJBg3RZlgecjlzS.Dlxe8/LKdA/gN1unABFffcYoX8eD7lyF2Wy',
                    provider: true,
                    created_at: '2020-03-18 20:05:59.99+00',
                    updated_at: '2020-03-18 20:05:59.99+00',
                },
                {
                    name: 'demo not Provider User',
                    email: 'demoNotProvider@gmail.com',
                    password_hash:
                        '$2a$08$tws9XBMA8ZVBatKyGz3vjuQ5LJnEIZNeaDJW6bi9qIFVofgTIfcXq',
                    provider: false,
                    created_at: '2020-03-18 20:10:01.408+00',
                    updated_at: '2020-03-18 20:10:01.408+00',
                },
            ],
            {}
        );
    },

    down: queryInterface => {
        return queryInterface.bulkDelete('People', null, {});
    },
};
