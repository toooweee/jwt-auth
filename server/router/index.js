const Router = require('express').Router;
const userController = require('../controllers/user-controller');

const router = new Router();
const {body} = require('express-validator');

router.post('/register',
    body('email').isEmail(),
    body('password').isLength({min: 6}),
    userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/users', userController.getUsers);

module.exports = router;
