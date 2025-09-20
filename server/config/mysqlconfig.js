const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connection established successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('MySQL Models synchronized');
    }

    process.on('SIGINT', async () => {
      await sequelize.close();
      console.log('MySQL connection closed due to app termination');
    });

  } catch (error) {
    console.error('Unable to connect to MySQL database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectMySQL };