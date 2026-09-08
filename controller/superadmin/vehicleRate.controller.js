const Joi = require("joi");
const dateFormat = require("dateformat");
const { db_Select, db_Insert } = require("../../model/Master.model");
const { getAllCustomerList } = require("./customer.controller");
const { getAllSellerList } = require("./seller.controller");
const {
  getAllVehicleList,
  show_vehicle_dtls,
} = require("./vehicle.controller");
const logger = require("../../model/LoggerModel");

const getAllVehicleRateList = (id = 0, cust_id) => {
  return new Promise(async (resolve, reject) => {
    var vehicle_rate = await db_Select(
      "seller_id,customer_id,rate_type,vehicle_id,from_hour,to_hour,vehicle_rate,rate_flag,night_day_flag",
      "md_rate_dtls",
      id > 0 ? `customer_id = ${cust_id} AND sl_no = ${id}` : null,
      null,
    );
    // console.log(vehicle_rate,'22');
    resolve(vehicle_rate);
  });
};
const getAllVehicleRateList_monthly = (id = 0, cust_id) => {
  return new Promise(async (resolve, reject) => {
    var vehicle_rate = await db_Select(
      "seller_id,customer_id,rate_type,vehicle_id,no_of_days,vehicle_rate,rate_flag,night_day_flag",
      "md_rate_dtls_monthly",
      id > 0 ? `customer_id = ${cust_id} AND sl_no = ${id}` : null,
      null,
    );
    // console.log(vehicle_rate,'22');
    resolve(vehicle_rate);
  });
};

const vehicle_rate = async (req, res) => {
  try {
    var method = req.method;
    var user = req.session.user;

    var selected = {
      cust_id: method == "POST" ? req.body.cust_name : "",
      veh_name: method == "POST" ? req.body.veh_id : "",
      rate_type: method == "POST" ? req.body.rate_type1 : "",
      veh_id: method == "POST" ? req.body.veh_id : "",
    };
    // console.log(selected, "pp");

    var cust = await getAllCustomerList();
    var seller_name = await getAllSellerList();
    var vehicle = await getAllVehicleList();
    veh_rate_list = [];
    if (method == "POST") {
      if (selected.rate_type === "Monthly") {
        veh_rate_list = await show_vehicle_rate_monthly(
          selected.cust_id,
          selected.veh_name,
        );
      } else {
        veh_rate_list = await show_vehicle_rate_dtls(
          selected.cust_id,
          selected.veh_name,
        );
      }
      veh_rate_list = veh_rate_list.suc > 0 ? veh_rate_list.msg : [];
    }
    console.log(veh_rate_list, selected.rate_type, "Lokesh TESTING rate_type");
    const page_data = {
      title: "Vehicle Rate details",
      page_path: "super_admin/vehicle_rate/vehicle_rate",
      data: veh_rate_list,
      rate_type: selected.rate_type,
      customer: cust.suc > 0 ? cust.msg : null,
      seller: seller_name.suc > 0 ? seller_name.msg : null,
      vehicle: vehicle.suc > 0 ? vehicle.msg : null,
      selected,
    };
    // console.log(data, "999");
    res.render("common/layouts/main", page_data);
    // console.log(page_data, "...");
  } catch (error) {
    // console.log(error);
    logger.error(err); // Log the error
    res.redirect("/superadmin_login");
  }
};

const show_vehicle_rate_dtls = (cust_id, veh_name) => {
  return new Promise(async (resolve, reject) => {
    let select = "a.*",
      table_name = "md_rate_dtls a",
      whr = `a.customer_id=${cust_id} AND a.vehicle_id = ${veh_name}`;
    const vehicle_dt = await db_Select(select, table_name, whr, null);
    resolve(vehicle_dt);
  });
};
const show_vehicle_rate_monthly = (cust_id, veh_name) => {
  return new Promise(async (resolve, reject) => {
    let select = "a.*",
      table_name = "md_rate_dtls_monthly a",
      whr = `a.customer_id=${cust_id} AND a.vehicle_id = ${veh_name}`;
    const vehicle_dt = await db_Select(select, table_name, whr, null);
    resolve(vehicle_dt);
  });
};

const get_vehicle = async (req, res) => {
  var data = req.body;
  // console.log(data, "1000");
  var select = "*",
    table_name = "md_vehicle",
    where = `customer_id = '${data.cust_id}'`;
  var veh_id = await db_Select(select, table_name, where, null);
  // console.log(veh_id, "lalala");
  res.json({
    SUCCESS: { veh_id },
    status: true,
  });
};

const vehicle_rate_edit = async (req, res) => {
  try {
    var data = req.query;
    // console.log(data,'55');
    var vehicle_rate = await getAllVehicleRateList(data.id, data.customer_id);
    var vehicle_dt = await show_vehicle_dtls(data.customer_id);
    var customer = await getAllCustomerList();
    var seller = await getAllSellerList();
    const page_data = {
      id: data.id,
      customer_id: data.customer_id,
      title: "Vehicle Edit details",
      page_path: "super_admin/vehicle_rate/edit_vehicle_rate",
      data: vehicle_rate.suc > 0 ? vehicle_rate.msg : null,
      vehicle: vehicle_dt.suc > 0 ? vehicle_dt.msg : null,
      customer: customer.suc > 0 ? customer.msg : null,
      seller: seller.suc > 0 ? seller.msg : null,
    };
    // console.log(page_data,'pp');
    res.render("common/layouts/main", page_data);
  } catch (error) {
    // console.log(error);
    logger.error(err); // Log the error
    res.redirect("/superadmin_login");
  }
};

const vehicle_rate_edit_monthly = async (req, res) => {
  try {
    var data = req.query;
    // console.log(data,'55');
    var vehicle_rate = await getAllVehicleRateList_monthly(
      data.id,
      data.customer_id,
    );
    var vehicle_dt = await show_vehicle_dtls(data.customer_id);
    var customer = await getAllCustomerList();
    var seller = await getAllSellerList();
    const page_data = {
      id: data.id,
      customer_id: data.customer_id,
      title: "Vehicle Edit details",
      page_path: "super_admin/vehicle_rate/edit_vehicle_rate_monthly",
      data: vehicle_rate.suc > 0 ? vehicle_rate.msg : null,
      vehicle: vehicle_dt.suc > 0 ? vehicle_dt.msg : null,
      customer: customer.suc > 0 ? customer.msg : null,
      seller: seller.suc > 0 ? seller.msg : null,
    };
    // console.log(page_data,'pp');
    res.render("common/layouts/main", page_data);
  } catch (error) {
    // console.log(error);
    logger.error(err); // Log the error
    res.redirect("/superadmin_login");
  }
};

const save_add_vehicle_rate = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.required(),
      sell_id: Joi.optional(),
      cust_name: Joi.optional(),
      cust_id: Joi.optional(),
      rate_name: Joi.optional(),
      rate_type: Joi.optional(),
      veh_id: Joi.string(),
      frm_hr: Joi.optional(),
      to_hr: Joi.optional(),
      park_fee: Joi.optional(),
      night_day_flag: Joi.optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    // console.log(value,'+++');
    if (error) {
      const isUpdate = req.body && req.body.id > 0;
      req.flash("error", "Validation error: Please check your inputs.");
      return res.redirect(
        isUpdate
          ? `/superadmin/vehicle_edit_rate?id=${req.body.id}&customer_id=${req.body.cust_id}`
          : "/superadmin/vehicle_rate",
      );
    }
    var user_name = req.session.user.userData.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    // ===== old data (for logging if update) =====
    let oldData = null;
    if (value.id > 0) {
      const existing_data = await db_Select(
        "*",
        "md_rate_dtls",
        `customer_id='${value.cust_id}' AND sl_no='${value.id}'`,
      );
      oldData = existing_data.msg[0] || null;
    }

    let f_hr = value.frm_hr || "0";
    let t_hr = value.to_hr || "24";
    let r_flag = value.rate_flag || "F";
    let rate_type = value.rate_type || "H";
    let night_day_flag = value.night_day_flag || "O";

    let sellerId = "0";
    if (value.id == 0) {
      const custData = await db_Select(
        "seller_id",
        "md_customer",
        `customer_id='${value.cust_name}'`,
        null,
      );
      if (custData.msg && custData.msg.length > 0) {
        sellerId = custData.msg[0].seller_id || "0";
      }
    }

    let fields =
        value.id > 0
          ? `from_hour='${f_hr}',to_hour='${t_hr}',vehicle_rate='${value.park_fee}',night_day_flag='${night_day_flag}',updated_by='${user_name}',updated_at='${datetime}'`
          : "(seller_id,customer_id,rate_type,vehicle_id,from_hour,to_hour,vehicle_rate,rate_flag,night_day_flag,created_by,created_at)",
      values = `('${sellerId}','${value.cust_name}','${rate_type}','${value.veh_id}','${f_hr}','${t_hr}','${value.park_fee}','${r_flag}','${night_day_flag}','${user_name}','${datetime}')`;
    let res_dt = await db_Insert(
      "md_rate_dtls",
      fields,
      values,
      value.id > 0
        ? `sl_no=${value.id} AND customer_id = ${value.cust_id}`
        : null,
      value.id > 0 ? 1 : 0,
    );
    // console.log("========vehicle==========", res_dt);

    // ===== Logging (common) =====
    if (oldData) {
      // ---- Update log ----
      const changes = [];
      if (oldData.from_hour !== f_hr)
        changes.push(`from_hour: '${oldData.from_hour}' → '${f_hr}'`);
      if (oldData.to_hour !== t_hr)
        changes.push(`to_hour: '${oldData.to_hour}' → '${t_hr}'`);
      if (oldData.vehicle_rate !== value.park_fee)
        changes.push(
          `vehicle_rate: '${oldData.vehicle_rate}' → '${value.park_fee}'`,
        );

      logger.info(
        `${user_name} Updated Vehicle [CustID: ${value.cust_id}, ID: ${value.id}] Fields changed: ${changes.join(", ")}`,
      );
      req.flash("success", "Updated successfully");
    } else {
      // ---- Create log with fields ----
      const createdFields = [
        `customer_id: '${value.cust_name}'`,
        `vehicle_id: '${value.veh_id}'`,
        `vehicle_rate: '${value.park_fee}'`,
      ];
      logger.info(
        `${user_name} Created Vehicle [CustID: ${value.cust_name}] Fields: ${createdFields.join(", ")}`,
      );
      req.flash("success", "Saved successfully");
    }
    res.redirect("/superadmin/vehicle_rate");
    //   res.send(res_dt)
  } catch (error) {
    // console.log(error,'ERRR');
    logger.error(error); // Log the error
    const isUpdate = req.body && req.body.id > 0;
    let errorMessage = isUpdate
      ? "Data not updated Successfully"
      : "Data not saved Successfully";

    if (error && error.code === "ER_DUP_ENTRY") {
      errorMessage = "Error: This record already exists!";
    }

    req.flash("error", errorMessage);

    if (isUpdate) {
      res.redirect(
        `/superadmin/vehicle_edit_rate?id=${req.body.id}&customer_id=${req.body.cust_id}`,
      );
    } else {
      res.redirect("/superadmin/vehicle_rate");
    }
  }
};

const save_add_vehicle_rate_monthly = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.required(),
      sell_id: Joi.optional(),
      cust_name: Joi.optional(),
      cust_id: Joi.optional(),
      rate_name: Joi.optional(),
      rate_type: Joi.optional(),
      veh_id: Joi.string(),
      no_of_days: Joi.optional(),
      park_fee: Joi.optional(),
      night_day_flag: Joi.optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    // console.log(value,'+++');
    if (error) {
      const isUpdate = req.body && req.body.id > 0;
      req.flash("error", "Validation error: Please check your inputs.");
      return res.redirect(
        isUpdate
          ? `/superadmin/vehicle_edit_rate_monthly?id=${req.body.id}&customer_id=${req.body.cust_id}`
          : "/superadmin/vehicle_rate",
      );
    }
    var user_name = req.session.user.userData.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    // ===== old data (for logging if update) =====
    let oldData = null;
    if (value.id > 0) {
      const existing_data = await db_Select(
        "*",
        "md_rate_dtls_monthly",
        `customer_id='${value.cust_id}' AND sl_no='${value.id}'`,
      );
      oldData = existing_data.msg[0] || null;
    }
    let r_flag = value.rate_flag || "F";
    let rate_type = value.rate_type || "S";
    let night_day_flag = value.night_day_flag || "O";

    let sellerId = "0";
    if (value.id == 0) {
      const custData = await db_Select(
        "seller_id",
        "md_customer",
        `customer_id='${value.cust_name}'`,
        null,
      );
      if (custData.msg && custData.msg.length > 0) {
        sellerId = custData.msg[0].seller_id || "0";
      }
    }

    let fields =
        value.id > 0
          ? `no_of_days='${value.no_of_days}',vehicle_rate='${value.park_fee}',night_day_flag='${night_day_flag}',updated_by='${user_name}',updated_at='${datetime}'`
          : "(seller_id,customer_id,rate_type,vehicle_id,no_of_days,vehicle_rate,rate_flag,night_day_flag,created_by,created_at)",
      values = `('${sellerId}','${value.cust_name}','${rate_type}','${value.veh_id}','${value.no_of_days}','${value.park_fee}','${r_flag}','${night_day_flag}','${user_name}','${datetime}')`;
    let res_dt = await db_Insert(
      "md_rate_dtls_monthly",
      fields,
      values,
      value.id > 0
        ? `sl_no=${value.id} AND customer_id = ${value.cust_id}`
        : null,
      value.id > 0 ? 1 : 0,
    );
    // console.log("========vehicle==========", res_dt);

    // ===== Logging (common) =====
    if (oldData) {
      // ---- Update log ----
      const changes = [];
      if (oldData.no_of_days !== value.no_of_days)
        changes.push(
          `no_of_days: '${oldData.no_of_days}' → '${value.no_of_days}'`,
        );
      if (oldData.to_hour !== value.to_hr)
        changes.push(`to_hour: '${oldData.to_hour}' → '${value.to_hr}'`);
      if (oldData.vehicle_rate !== value.park_fee)
        changes.push(
          `vehicle_rate: '${oldData.vehicle_rate}' → '${value.park_fee}'`,
        );

      logger.info(
        `${user_name} Updated Vehicle [CustID: ${value.cust_id}, ID: ${value.id}] Fields changed: ${changes.join(", ")}`,
      );
      req.flash("success", "Updated successfully");
    } else {
      // ---- Create log with fields ----
      const createdFields = [
        `customer_id: '${value.cust_name}'`,
        `vehicle_id: '${value.veh_id}'`,
        `vehicle_rate: '${value.park_fee}'`,
      ];
      logger.info(
        `${user_name} Created Vehicle [CustID: ${value.cust_name}] Fields: ${createdFields.join(", ")}`,
      );
      req.flash("success", "Saved successfully");
    }
    res.redirect("/superadmin/vehicle_rate");
    //   res.send(res_dt)
  } catch (error) {
    // console.log(error,'ERRR');
    logger.error(error); // Log the error
    const isUpdate = req.body && req.body.id > 0;
    let errorMessage = isUpdate
      ? "Data not updated Successfully"
      : "Data not saved Successfully";

    if (error && error.code === "ER_DUP_ENTRY") {
      errorMessage = "Error: This record already exists!";
    }

    req.flash("error", errorMessage);

    if (isUpdate) {
      res.redirect(
        `/superadmin/vehicle_edit_rate_monthly?id=${req.body.id}&customer_id=${req.body.cust_id}`,
      );
    } else {
      res.redirect("/superadmin/vehicle_rate");
    }
  }
};

const getCustListAjax = async (req, res) => {
  var data = req.body;
  var cust_list = await getAllCustomerList(0, data.sailer_id);
  // console.log(cust_list, "555");
  res.send(cust_list);
};

module.exports = {
  vehicle_rate,
  show_vehicle_rate_dtls,
  get_vehicle,
  save_add_vehicle_rate,
  save_add_vehicle_rate_monthly,
  getCustListAjax,
  vehicle_rate_edit,
  vehicle_rate_edit_monthly,
};
