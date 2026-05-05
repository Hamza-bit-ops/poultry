import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as farm from '../controllers/farmController.js';
import * as poultryType from '../controllers/poultryTypeController.js';
import * as unit from '../controllers/unitController.js';
import * as accountHead from '../controllers/accountHeadController.js';
import * as role from '../controllers/roleController.js';
import * as user from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.route('/farms').get(farm.listFarms).post(farm.createFarm);
router.route('/farms/:id').get(farm.getFarm).put(farm.updateFarm).delete(farm.deleteFarm);

router.route('/poultry-types').get(poultryType.list).post(poultryType.create);
router.route('/poultry-types/:id').get(poultryType.getOne).put(poultryType.update).delete(poultryType.remove);

router.route('/units').get(unit.list).post(unit.create);
router.route('/units/:id').get(unit.getOne).put(unit.update).delete(unit.remove);

router.route('/account-heads').get(accountHead.list).post(accountHead.create);
router.route('/account-heads/:id').get(accountHead.getOne).put(accountHead.update).delete(accountHead.remove);

router.route('/roles').get(role.list).post(role.create);
router.route('/roles/:id').get(role.getOne).put(role.update).delete(role.remove);

router.route('/users').get(user.list).post(user.create);
router.route('/users/:id').get(user.getOne).put(user.update).delete(user.remove);

export default router;
