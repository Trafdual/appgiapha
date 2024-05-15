const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const userroute = require('./routes/UserRoutes');
const caygiapha = require('./routes/CayGiaPharoutes');
const bangtinroute = require('./routes/BaiVietBangTinRoutes');
const vankhanroute = require('./routes/VanKhanRoutes');
const eventroute = require('./routes/EventRoutes');
const giaimongroute = require('./routes/GiacMongRoutes');
const quexamroute=require('./routes/QueXamRoutes');
const homeroutes=require('./routes/Homeroutes')
const modelroutes=require('./routes/ModelRouter');
var path = require('path');


var app = express();
app.use(methodOverride('_method'));

const uri = "mongodb+srv://traz08102003:G1XMVWTucFqfpNch@cp17303.4gzmzyt.mongodb.net/giapha?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(console.log("kết nối thành công"));

const mongoStoreOptions = {
  mongooseConnection: mongoose.connection,
  mongoUrl: uri,
  collection: 'sessions',
};

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/uploads')));



app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create(mongoStoreOptions),
  cookie: {
    secure: false,
  }
}));
app.use(cors());

app.use('/', userroute);
app.use('/', caygiapha);
app.use('/', bangtinroute);
app.use('/', vankhanroute);
app.use('/', eventroute);
app.use('/', giaimongroute);
app.use('/', quexamroute);
app.use('/',homeroutes);
app.use('/',modelroutes);

const port=process.env.PORT || 8080
app.listen(port, () => {
  try {
    console.log('kết nối thành công 8080')
  } catch (error) {
    console.log('kết nối thất bại 8080', error)
  }
}
);