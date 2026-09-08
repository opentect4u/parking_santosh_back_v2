const {
  vehicle_rate,
  get_vehicle,
  save_add_vehicle_rate,
  save_add_vehicle_rate_monthly,
  getCustListAjax,
  vehicle_rate_edit,
  vehicle_rate_edit_monthly,
} = require("../../controller/superadmin/vehicleRate.controller");
const {
  AuthSuperCheckedMW,
} = require("../../middleware/AuthChecked.middleware");

const VehicleRateRouter = require("express").Router();

(VehicleRateRouter.all("/vehicle_rate", AuthSuperCheckedMW, vehicle_rate),
  VehicleRateRouter.post("/vehicle_dt", AuthSuperCheckedMW, get_vehicle),
  VehicleRateRouter.post(
    "/vehicle_rate_save",
    AuthSuperCheckedMW,
    save_add_vehicle_rate,
  ),
  VehicleRateRouter.post(
    "/vehicle_rate_save_monthly",
    AuthSuperCheckedMW,
    save_add_vehicle_rate_monthly,
  ),
  VehicleRateRouter.get(
    "/vehicle_edit_rate",
    AuthSuperCheckedMW,
    vehicle_rate_edit,
  ),
  VehicleRateRouter.get(
    "/vehicle_edit_rate_monthly",
    AuthSuperCheckedMW,
    vehicle_rate_edit_monthly,
  ),
  VehicleRateRouter.post(
    "/cust_list_ajax",
    AuthSuperCheckedMW,
    getCustListAjax,
  ),
  (module.exports = { VehicleRateRouter }));
