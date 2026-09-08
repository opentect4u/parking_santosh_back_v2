const Joi = require("joi");
const dateFormat = require("dateformat");
const { db_Select, db_Insert } = require("../../model/Master.model");
const logger = require('../../model/LoggerModel');
const { getAllCustomerList } = require("./customer.controller");

const getAllGSTList = (id = 0, cust_id) => {
  return new Promise(async (resolve, reject) => {
    var gst_dt = await db_Select(
      "*",
      "md_gst",
      id > 0 ? `customer_id = ${cust_id} AND gst_id = ${id}` : null,
      null
    );
    resolve(gst_dt);
  });
};

const gst = async (req, res) => {
  try {
    var cust = await getAllCustomerList()
    var gst_dt = await show_gst_dtls()
    const page_data = {
      title: "GST details",
      page_path: "super_admin/gst/add_gst",
      data: gst_dt,
      customer: cust.suc > 0 ? cust.msg : null,
    };
    // console.log(data, "999");
    res.render("common/layouts/main", page_data);
  } catch (error) {
    // console.log(error);
    logger.error(err);
    res.redirect("/superadmin_login");
  }
};

const show_gst_dtls = () => {
  return new Promise(async (resolve, reject) => {
    let select = "a.*, b.customer_name",
      table_name = "md_gst a, md_customer b",
      whr = `a.customer_id = b.customer_id`;
    const gst_dt = await db_Select(select, table_name, whr, null);
    resolve(gst_dt);
  });
};

const gst_edit = async (req, res) => {
  try {
    var data = req.query
    // console.log(data,'dadada');

    var gst_dt = await getAllGSTList(data.id, data.customer_id)
    var cust = await getAllCustomerList()
    const page_data = {
      id: data.id,
      customer_id: data.customer_id,
      title: "GST Edit details",
      page_path: "/super_admin/gst/edit_gst",
      data: gst_dt.suc > 0 ? gst_dt.msg : null,
      customer: cust.suc > 0 ? cust.msg : null,
    };
    // console.log(page_data,'ll');
    res.render("common/layouts/main", page_data);
  } catch (error) {
    // console.log(error);
    logger.error(err); // Log the error
    res.redirect("/superadmin_login");
  }
};

const save_add_gst = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.optional(),
      cust_name: Joi.optional(),
      cust_id: Joi.optional(),
      gst_category: Joi.required(),
      gst_num: Joi.required(),
      cgst: Joi.string(),
      sgst: Joi.string().allow('', null),
      igst: Joi.string().allow('', null),
      total_gst: Joi.string()
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    console.log("Submitted Form Data:", value);
    if (error) {
      const isUpdate = req.body && req.body.id > 0;
      req.flash("error", "Validation error: Please check your inputs.");
      return res.redirect(isUpdate ? `/superadmin/edit_gst?id=${req.body.id}` : "/superadmin/gst");
    }

    var user_name = req.session.user.userData.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    let oldData = null;
    if (value.id > 0) {
      const existing = await db_Select(
        "*",
        "md_gst",
        `customer_id='${value.cust_id}' AND gst_id='${value.id}'`
      );
      oldData = existing.msg[0] || null;
    }

    const fields = value.id > 0 ? `gst_mode = '${value.gst_category === 'C' || value.gst_category === 'CS' ? 'CS' : 'I'}',gst_number = '${value.gst_num}', total_gst = '${value.total_gst}', cgst = ${value.gst_category === 'C' || value.gst_category === 'CS' ? `'${value.cgst ? value.cgst.replace('%', '') : 0.00}'` : `'0.00'`}, sgst = ${value.gst_category === 'C' || value.gst_category === 'CS' ? `'${value.sgst ? value.sgst.replace('%', '') : 0.00}'` : `'0.00'`},igst=${value.gst_category == 'I' ? `'${value.igst ? value.igst.replace('%', '') : 0.00}'` : `'0.00'`}, updated_by = '${value.cust_id}', updated_at = '${datetime}'` : "(customer_id,gst_flag,gst_type,gst_mode,gst_number,total_gst,cgst,sgst,igst,created_by,created_at,updated_by,updated_at)",
      values = `('${value.cust_name}','Y','I','${value.gst_category === 'C' || value.gst_category === 'CS' ? 'CS' : 'I'}','${value.gst_num}','${value.total_gst}',${value.gst_category === 'C' || value.gst_category === 'CS' ? `'${value.cgst ? value.cgst.replace('%', '') : 0.00}'` : `'0.00'`},${value.gst_category === 'C' || value.gst_category === 'CS' ? `'${value.sgst ? value.sgst.replace('%', '') : 0.00}'` : `'0.00'`},${value.gst_category == 'I' ? `'${value.igst ? value.igst.replace('%', '') : 0.00}'` : `'0.00'`},'${value.cust_name}','${datetime}','${value.cust_name}','${datetime}')`
    whr = value.id > 0 ? `customer_id='${value.cust_name}' AND gst_id='${value.id}'` : null,
      flag = value.id > 0 ? 1 : 0;
    var res_dt = await db_Insert("md_gst", fields, values, whr, flag);

    // ===== Logging (common) =====
    if (oldData) {
      // ---- Update log ----
      const changes = [];
      if (oldData.gst_mode !== value.gst_category)
        changes.push(`gst_mode: '${oldData.gst_mode}' → '${value.gst_category}'`);
      if (oldData.gst_number !== value.gst_num)
        changes.push(`gst_number: '${oldData.gst_number}' → '${value.gst_num}'`);
      if (oldData.total_gst !== value.total_gst)
        changes.push(`total_gst: '${oldData.total_gst}' → '${value.total_gst}'`);
      if (String(oldData.cgst) !== String(value.cgst))
        changes.push(`cgst: '${oldData.cgst}' → '${value.cgst}'`);
      if (String(oldData.sgst) !== String(value.sgst))
        changes.push(`sgst: '${oldData.sgst}' → '${value.sgst}'`);
      if (String(oldData.igst) !== String(value.igst))
        changes.push(`igst: '${oldData.igst}' → '${value.igst}'`);

      console.log("Updated Fields:", changes);
      logger.info(
        `${user_name} Updated Admin [CustID: ${value.cust_id}, ID: ${value.id}] Fields changed: ${changes.join(", ")}`
      );
      req.flash("success", "Updated successfully");

      // console.log("========gst==========", res_dt);
      req.flash("success", value.id > 0 ? "Updated successfully" : "Saved successfully");
    } else {
      // ---- Create log with fields ----
      const createdFields = [
        `customer_id: '${value.cust_name}'`,
        `gst_category: '${value.gst_category}'`,
        `gst_number: '${value.gst_num}'`,
        `total_gst: '${value.total_gst}'`,
        `cgst: '${value.cgst}'`,
        `sgst: '${value.sgst}'`,
        `igst: '${value.igst}'`
      ];
      console.log("Created Fields:", createdFields);
      logger.info(
        `${user_name} Created Admin [CustID: ${value.cust_name}] Fields: ${createdFields.join(
          ", "
        )}`
      );
      req.flash("success", "Saved successfully");
    }
    res.redirect("/superadmin/gst");

  } catch (error) {
    // console.log(error);
    logger.error(error); // Log the error
    const isUpdate = req.body && req.body.id > 0;
    let errorMessage = isUpdate ? "Data not updated Successfully" : "Data not saved Successfully";
    
    if (error && error.code === 'ER_DUP_ENTRY') {
      errorMessage = "Error: GST record already exists!";
    }

    req.flash("error", errorMessage);
    
    if (isUpdate) {
      res.redirect("/superadmin/edit_gst?id=" + req.body.id);
    } else {
      res.redirect("/superadmin/gst");
    }
  }
};

module.exports = { gst, save_add_gst, gst_edit }