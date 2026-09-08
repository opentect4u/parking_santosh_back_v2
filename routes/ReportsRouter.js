const { AuthCheckedMW } = require("../middleware/AuthChecked.middleware");
const { db_Select, db_Select_Sqery } = require("../model/Master.model");

const express = require("express"),
  reportRouter = express.Router(),
  dateFormat = require("dateformat");

reportRouter.get("/", AuthCheckedMW, async (req, res) => {
  res.redirect("/report/unbilled_report");
});

reportRouter.get("/details_report", AuthCheckedMW, async (req, res) => {
  var data = {
    title: "Detail Report",
    page_path: "reports/details_report",
    dtFormat: dateFormat,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/details_report_new", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var custId = customer.length > 0 ? customer[0].cust_id : null;
  var operator = [];
  if (custId) {
    operator = await getoperatorlist(custId); // ✅ pass customer id
  }

  var data = {
    title: "Detail Report",
    page_path: "reports/detail_report_new.ejs",
    dtFormat: dateFormat,
    data: customer,
    operators: operator,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get(
  "/details_report_new_admin",
  AuthCheckedMW,
  async (req, res) => {
    var customer = await getcustomerlist();
    var custId = req.session.user.userData.customer_id;

    var operator = [];
    if (custId) {
      operator = await getoperatorlist(custId); // ✅ pass customer id
    }

    var data = {
      title: "Detail Report",
      page_path: "reports/detail_report_new_admin.ejs",
      dtFormat: dateFormat,
      data: customer,
      operators: operator,
    };
    res.render("common/layouts/main", data);
  },
);

reportRouter.post(
  "/get_operators_by_location",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const { custId } = req.body;
      const operators = await getoperatorlist(custId); // ✅ pass custId
      res.send(operators);
    } catch (err) {
      console.error(err);
      res.send({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_devices_by_location",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const { custId } = req.body;
      const devices = await db_Select(
        "*",
        "md_setting",
        `customer_id='${custId}'`,
      );
      res.send(devices);
    } catch (err) {
      console.error(err);
      res.send({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_vehicles_by_location",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const { custId } = req.body;
      const vehicles = await db_Select(
        "vehicle_id, vehicle_name",
        "md_vehicle",
        `customer_id='${custId}'`,
      );
      res.send(vehicles);
    } catch (err) {
      console.error(err);
      res.send({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post("/get_details_report", AuthCheckedMW, async (req, res) => {
  var custId = req.session.user.user_data.customer_id,
    userType = req.session.user.user_data.user_type;

  var data = req.body;
  var select = `receiptNo, date_time_in, mc_srl_no, vehicleType, vehicle_no, opratorName, date_time_out, paid_amt, mc_srl_no_out`,
    table_name = "td_backlog_data",
    whr = `DATE(date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`,
    order = "ORDER BY receiptNo";
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

reportRouter.post(
  "/get_details_report_new",
  AuthCheckedMW,
  async (req, res) => {
    var data = req.body;
    console.log(data, "kk");

    if (data.pay_mode == "A") {
      var select = `a.receipt_no, a.date_time_in, a.device_id, d.vehicle_name, a.vehicle_no, b.date_time_out, b.device_id device_id_out, c.base_amt, c.advance_amt, c.cgst, c.sgst, c.paid_amt, c.pay_mode, f.operator_name`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`,
        order = "ORDER BY a.receipt_no";
      var res_dt = await db_Select(select, table_name, whr, order);
      console.log(res_dt);
      res.send(res_dt);
    } else {
      var select = `a.receipt_no, a.date_time_in, a.device_id, d.vehicle_name, a.vehicle_no, b.date_time_out, b.device_id device_id_out, c.base_amt, c.advance_amt, c.cgst, c.sgst, c.paid_amt, c.pay_mode, f.operator_name`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}' AND c.pay_mode = '${data.pay_mode}'`,
        order = "ORDER BY a.receipt_no";
      var res_dt = await db_Select(select, table_name, whr, order);
      console.log(res_dt);
      res.send(res_dt);
    }
  },
);

// reportRouter.post(
//   "/get_details_report_new",
//   AuthCheckedMW,
//   async (req, res) => {
//     try {
//       const data = req.body;
//       // console.log(data, "kk");

//       const start = parseInt(data.start) || 0;
//       const length = parseInt(data.length) || 50;
//       const search = data["search[value]"] || "";

//       let select = `
//         a.receipt_no, a.date_time_in, a.device_id, d.vehicle_name, a.vehicle_no,
//         b.date_time_out, b.device_id device_id_out, c.base_amt, c.advance_amt,
//         c.cgst, c.sgst, c.paid_amt, c.other_charges, c.pay_mode, f.operator_name
//       `;

//       let table_name = `
//         td_vehicle_in a, td_vehicle_out b, td_receipt c,
//         md_vehicle d, md_user e, md_operator f
//       `;

//       let whr = `
//         a.receipt_no=b.receipt_no
//         AND a.receipt_no=c.receipt_no
//         AND a.vehicle_id=d.vehicle_id
//         AND a.user_id_in=e.id
//         AND e.user_id=f.user_id
//         AND a.car_out_flag='Y'
//         AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}'
//         AND a.customer_id='${data.custId}'
//       `;

//       // ✅ Handle filters
//       if (data.pay_mode && data.pay_mode !== "A") {
//         whr += ` AND c.pay_mode='${data.pay_mode}'`;
//       }

//       if (data.operator_id && data.operator_id !== "A") {
//         whr += ` AND f.operator_id='${data.operator_id}'`;
//       }

//       let order = "ORDER BY a.receipt_no";

//       let res_dt = await db_Select(select, table_name, whr, order);
//       // console.log(res_dt);
//       res.send(res_dt);
//     } catch (err) {
//       console.error(err);
//       res.status(500).send({ error: "Server error" });
//     }
//   },
// );

reportRouter.post(
  "/get_details_report_excel",
  AuthCheckedMW,
  async (req, res) => {
    // var custId = req.session.user.user_data.customer_id;
    var data = req.body;
    console.log(data, "data");

    let table_name = `td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f`;

    let whr = `
      a.receipt_no = b.receipt_no 
      AND a.receipt_no = c.receipt_no 
      AND a.vehicle_id = d.vehicle_id 
      AND a.user_id_in = e.id 
      AND e.user_id = f.user_id 
      AND a.car_out_flag = 'Y'
      AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}'
      AND a.customer_id = '${data.custId}'
    `;

    if (data.pay_mode !== "A") {
      whr += ` AND c.pay_mode = '${data.pay_mode}'`;
    }

    // MAIN DATA
    let select = `
      a.receipt_no,
      DATE_FORMAT(a.date_time_in, '%d/%m/%Y %H:%i:%s') AS date_time_in,
      a.device_id,
      d.vehicle_name,
      a.vehicle_no,
      DATE_FORMAT(b.date_time_out, '%d/%m/%Y %H:%i:%s') AS date_time_out,
      SEC_TO_TIME(TIMESTAMPDIFF(SECOND, a.date_time_in, b.date_time_out)) AS total_time,
      b.device_id AS device_id_out,
      c.base_amt,
      c.advance_amt,
      c.cgst,
      c.sgst,
      c.igst,
      c.paid_amt,
      c.pay_mode,
      f.operator_name
    `;

    let order = `ORDER BY a.receipt_no`;

    let res_dt = await db_Select(select, table_name, whr, order);

    // TOTAL QUERY ------------------------------------
    let totalSelect = `
      SUM(c.base_amt) AS total_base,
      SUM(c.advance_amt) AS total_advance,
      SUM(c.cgst) AS total_cgst,
      SUM(c.sgst) AS total_sgst,
      SUM(c.igst) AS total_igst,
      SUM(c.paid_amt) AS total_paid,
      SUM(c.paid_amt) AS total_net,
      SUM(CASE WHEN c.pay_mode='C' THEN c.paid_amt ELSE 0 END) AS total_cash,
      SUM(CASE WHEN c.pay_mode='U' THEN c.paid_amt ELSE 0 END) AS total_upi
    `;

    let totals = await db_Select(totalSelect, table_name, whr);

    res.send({
      suc: res_dt.suc,
      data: res_dt.msg,
      totals: totals.msg[0], // <-- all totals in one object
    });
  },
);

const getcustomerlist = () => {
  return new Promise(async (resolve, reject) => {
    var select = "customer_id,customer_name",
      table_name = "md_customer",
      where = null,
      order = null;
    var customer_data = await db_Select(select, table_name, where, order);
    //  console.log(customer_data);
    resolve(customer_data);
  });
};

const getoperatorlist = (custId) => {
  return new Promise(async (resolve, reject) => {
    var select = "operator_id,operator_name",
      table_name = "md_operator",
      where = `customer_id = '${custId}'`,
      order = null;
    var operator_data = await db_Select(select, table_name, where, order);
    //  console.log(operator_data);
    resolve(operator_data);
  });
};

reportRouter.get("/unbilled_report", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var data = {
    title: "Unbilled Report",
    page_path: "reports/unbilled_report.ejs",
    dtFormat: dateFormat,
    data: customer,
  };
  // console.log(data);

  res.render("common/layouts/main", data);
});

reportRouter.post("/get_unbilled_report", AuthCheckedMW, async (req, res) => {
  try {
    var data = req.body;
    const draw = parseInt(data.draw) || 1;
    const start = parseInt(data.start) || 0;
    const length = parseInt(data.length) || 50;

    let baseWhere = `a.car_out_flag = 'N' AND a.intype = '${data.intype}' AND a.date_time_in BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;

    if (data.search && data.search.value) {
      baseWhere += ` AND a.vehicle_no LIKE '%${data.search.value}%'`;
    }

    var table_name = `td_vehicle_in a JOIN md_vehicle d ON a.vehicle_id=d.vehicle_id
        JOIN md_user e ON a.user_id_in=e.id 
        JOIN md_operator f ON e.user_id=f.user_id  
        LEFT JOIN td_receipt g ON a.receipt_no = g.receipt_no`;

    const totalRec = await db_Select(
      "COUNT(*) as count",
      table_name,
      baseWhere,
      null,
    );
    let totalRecords = totalRec.suc > 0 ? totalRec.msg[0].count : 0;

    var select = `a.receipt_no, a.date_time_in, a.device_id, d.vehicle_name, a.vehicle_no, f.operator_name, g.advance_amt`;
    const orderLimit = `ORDER BY a.receipt_no LIMIT ${start}, ${length}`;

    var res_dt = await db_Select(select, table_name, baseWhere, orderLimit);

    const grandTotalsQuery = await db_Select(
      `SUM(g.advance_amt) AS advance_amt`,
      table_name,
      baseWhere,
      null,
    );
    const grandTotals =
      grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : { advance_amt: 0 };

    res.json({
      draw: draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: res_dt.suc > 0 ? res_dt.msg : [],
      grandTotals: grandTotals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

reportRouter.get("/veh_wise_repo", AuthCheckedMW, async (req, res) => {
  var data = {
    title: "Veichle Wise Report",
    page_path: "reports/veh_wise_repo",
    dtFormat: dateFormat,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/veh_wise_repo_new", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var data = {
    title: "Vehicle Wise Report",
    page_path: "reports/veh_wise_repo_new",
    dtFormat: dateFormat,
    data: customer,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get(
  "/veh_wise_repo_new_admin",
  AuthCheckedMW,
  async (req, res) => {
    var customer = await getcustomerlist();
    var data = {
      title: "Vehicle Wise Report",
      page_path: "reports/veh_wise_repo_new_admin",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  },
);

reportRouter.post("/get_veh_wise_report", AuthCheckedMW, async (req, res) => {
  var data = req.body;
  var select = `mc_srl_no_out, vehicleType, COUNT(receiptNo) tot_vehi, SUM(paid_amt) tot_amt`,
    table_name = "td_backlog_data",
    whr = `DATE(date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`,
    order = "GROUP BY vehicleType, mc_srl_no_out";
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

reportRouter.post(
  "/get_veh_wise_report_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;
      console.log(whr, "For testing in type");
      // Count total records safely by fetching grouped rows
      let groupBy = "GROUP BY d.vehicle_name";
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `GROUP BY a.vehicle_id ORDER BY a.vehicle_id LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      // Compute grand totals
      const grandTotalsQuery = await db_Select(
        `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_veh_wise_report_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      var select = `d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`,
        order = "GROUP BY a.vehicle_id";

      var res_dt = await db_Select(select, table_name, whr, order);
      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [] });
    }
  },
);

reportRouter.get("/dev_wise_repo", AuthCheckedMW, async (req, res) => {
  var data = {
    title: "Device Wise Report",
    page_path: "reports/dev_wise_repo",
    dtFormat: dateFormat,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/dev_wise_repo_new", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var data = {
    title: "Device Wise Report",
    page_path: "reports/dev_wise_repo_new",
    dtFormat: dateFormat,
    data: customer,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get(
  "/dev_wise_repo_new_admin",
  AuthCheckedMW,
  async (req, res) => {
    var customer = await getcustomerlist();
    var data = {
      title: "Device Wise Report",
      page_path: "reports/dev_wise_repo_new_admin",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  },
);

reportRouter.post("/get_dev_wise_report", AuthCheckedMW, async (req, res) => {
  var data = req.body;
  var select = `vehicleType, COUNT(receiptNo) tot_vehi, SUM(paid_amt) tot_amt`,
    table_name = "td_backlog_data",
    whr = `DATE(date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`,
    order = "GROUP BY vehicleType";
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

reportRouter.post(
  "/get_dev_wise_report_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `b.device_id mc_srl_no_out, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
        table_name = "td_vehicle_in a, td_vehicle_out b, td_receipt c",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;

      let groupBy = "GROUP BY b.device_id";
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `${groupBy} ORDER BY b.device_id LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      // Compute grand totals
      const grandTotalsQuery = await db_Select(
        `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_dev_wise_report_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      var select = `b.device_id mc_srl_no_out, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
        table_name = "td_vehicle_in a, td_vehicle_out b, td_receipt c",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`,
        order = "GROUP BY b.device_id";

      var res_dt = await db_Select(select, table_name, whr, order);
      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [] });
    }
  },
);

reportRouter.get("/operator_wise_repo_new", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var data = {
    title: "Operator Wise Report",
    page_path: "reports/operator_wise_repo_new",
    dtFormat: dateFormat,
    data: customer,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get(
  "/operator_wise_repo_new_admin",
  AuthCheckedMW,
  async (req, res) => {
    var customer = await getcustomerlist();
    var data = {
      title: "Operator Wise Report",
      page_path: "reports/operator_wise_repo_new_admin",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  },
);

reportRouter.post(
  "/get_operator_wise_repo_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst, f.operator_name opratorName`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;

      let groupBy = "GROUP BY a.user_id_in, b.device_id, d.vehicle_name";

      // Count total records safely by fetching grouped rows
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `${groupBy} ORDER BY a.user_id_in, b.device_id, d.vehicle_name LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      // Compute grand totals
      const grandTotalsQuery = await db_Select(
        `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_operator_wise_repo_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst, f.operator_name opratorName`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`,
        order =
          "GROUP BY a.user_id_in, b.device_id, d.vehicle_name ORDER BY a.user_id_in, b.device_id, d.vehicle_name";

      var res_dt = await db_Select(select, table_name, whr, order);
      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [] });
    }
  },
);

reportRouter.get("/combine_repo_new", AuthCheckedMW, async (req, res) => {
  try {
    var customer = await getcustomerlist();
    var data = {
      title: "Combine Report (Vehicle)",
      page_path: "reports/combine_report_new",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading report");
  }
});

reportRouter.post("/get_combine_repo_new", AuthCheckedMW, async (req, res) => {
  try {
    var custId = req.session.user.userData
      ? req.session.user.userData.customer_id
      : req.session.user.user_data
        ? req.session.user.user_data.customer_id
        : 0;
    var data = req.body;
    const draw = parseInt(data.draw) || 1;
    const start = parseInt(data.start) || 0;
    const length = parseInt(data.length) || 50;

    var select = `f.operator_name, a.device_id, b.vehicle_name vehicleType, SUM(c.advance_amt) advance_amt, SUM(c.paid_amt) paid_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
      table_name =
        "td_vehicle_in a, md_vehicle b, td_receipt c, td_vehicle_out d, md_user e, md_operator f",
      whr = `a.vehicle_id = b.vehicle_id AND a.receipt_no = c.receipt_no AND a.receipt_no = d.receipt_no AND c.user_id = e.id AND e.user_id = f.user_id AND a.customer_id = '${data.custId}' AND a.vehicle_id = '${data.vehicle_id}' AND a.intype = '${data.intype}' AND d.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`;
    console.log(whr);
    let groupBy = "GROUP BY f.operator_name, a.device_id, b.vehicle_name";
    const res_count = await db_Select("1", table_name, whr, groupBy);
    let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

    let orderLimit = `${groupBy} LIMIT ${start}, ${length}`;
    var res_dt = await db_Select(select, table_name, whr, orderLimit);

    const grandTotalsQuery = await db_Select(
      `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
      table_name,
      whr,
      null,
    );
    const grandTotals = grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

    res.json({
      draw: draw,
      recordsTotal: totalRecords,
      recordsFiltered: totalRecords,
      data: res_dt.suc > 0 ? res_dt.msg : [],
      suc: res_dt.suc > 0 ? 1 : 0,
      grandTotals: grandTotals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ suc: 0, msg: [] });
  }
});

reportRouter.get("/combine_repo_dev_new", AuthCheckedMW, async (req, res) => {
  try {
    var customer = await getcustomerlist();
    var data = {
      title: "Combine Report (Device)",
      page_path: "reports/combine_report_dev_new",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading report");
  }
});

reportRouter.post(
  "/get_combine_repo_dev_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var custId = req.session.user.userData
        ? req.session.user.userData.customer_id
        : req.session.user.user_data
          ? req.session.user.user_data.customer_id
          : 0;
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `f.operator_name, d.device_id, b.vehicle_name vehicleType, SUM(c.advance_amt) advance_amt, SUM(c.paid_amt) paid_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst`,
        table_name =
          "td_vehicle_in a, md_vehicle b, td_receipt c, td_vehicle_out d, md_user e, md_operator f",
        whr = `a.vehicle_id = b.vehicle_id AND a.receipt_no = c.receipt_no AND a.receipt_no = d.receipt_no AND c.user_id = e.id AND e.user_id = f.user_id AND a.customer_id = '${data.custId}' AND d.device_id = '${data.device_id}' AND a.intype = '${data.intype}' AND d.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`;

      let groupBy = "GROUP BY f.operator_name, d.device_id, b.vehicle_name";
      console.log(whr);
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `${groupBy} LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      const grandTotalsQuery = await db_Select(
        `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.get("/usr_wise_repo", AuthCheckedMW, async (req, res) => {
  var data = {
    title: "User Wise Report",
    page_path: "reports/usr_wise_repo",
    dtFormat: dateFormat,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/usr_wise_repo_new", AuthCheckedMW, async (req, res) => {
  try {
    var customer = await getcustomerlist();
    var data = {
      title: "User Wise Report",
      page_path: "reports/usr_wise_repo_new",
      dtFormat: dateFormat,
      data: customer,
    };
    res.render("common/layouts/main", data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading report");
  }
});

reportRouter.post("/get_user_wise_report", AuthCheckedMW, async (req, res) => {
  var data = req.body;
  var select = `opratorName, mc_srl_no_out, COUNT(receiptNo) tot_vehi, SUM(paid_amt) tot_amt`,
    table_name = "td_backlog_data",
    whr = `DATE(date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}'`,
    order = "GROUP BY opratorName, mc_srl_no_out";
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

reportRouter.post(
  "/get_user_wise_report_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var custId = req.session.user.user_data
        ? req.session.user.user_data.customer_id
        : req.session.user.userData
          ? req.session.user.userData.customer_id
          : 0;
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `b.device_id mc_srl_no_out, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst, f.operator_name opratorName`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_user e, md_operator f",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;

      if (data.operator_id) {
        whr += ` AND f.operator_id = '${data.operator_id}'`;
      }

      let groupBy = "GROUP BY f.operator_name, b.device_id";
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `${groupBy} LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      const grandTotalsQuery = await db_Select(
        `COUNT(b.receipt_no) as tot_vehi, SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.get("/shift_wise_repo", AuthCheckedMW, async (req, res) => {
  // var custId = req.session.user.user_data.customer_id;
  // var shiftData = await db_Select(
  //     "shift_id, shift_name, f_time, t_time",
  //     "md_shift",
  //     `customer_id=${custId}`,
  //     "ORDER BY f_time"
  //   );
  var customer = await getcustomerlist();
  var data = {
    title: "Shiftwise Report",
    page_path: "reports/shift_report_new",
    dtFormat: dateFormat,
    data: customer,
    // shiftData: shiftData,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/shift_wise_repo_admin", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var data = {
    title: "Shiftwise Report",
    page_path: "reports/shift_report_new_admin",
    dtFormat: dateFormat,
    data: customer,
  };
  res.render("common/layouts/main", data);
});

reportRouter.post(
  "/get_shift_wise_repo_new",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) AS advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst, f.operator_name opratorName, g.shift_name, g.f_time, g.t_time`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f, md_shift g",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.customer_id = g.customer_id AND TIME(b.date_time_out) BETWEEN g.f_time AND g.t_time AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`;

      let groupBy =
        "GROUP BY a.user_id_in, b.device_id, d.vehicle_name, f.operator_name, g.shift_name, g.f_time, g.t_time";

      // Count total records safely by fetching grouped rows
      const res_count = await db_Select("1", table_name, whr, groupBy);
      let totalRecords = res_count.suc > 0 ? res_count.msg.length : 0;

      let orderLimit = `${groupBy} ORDER BY g.f_time LIMIT ${start}, ${length}`;
      var res_dt = await db_Select(select, table_name, whr, orderLimit);

      // Compute grand totals
      const grandTotalsQuery = await db_Select(
        `SUM(c.paid_amt) as paid_amt, SUM(c.advance_amt) as advance_amt, SUM(c.base_amt) as base_amt, SUM(c.cgst) as cgst, SUM(c.sgst) as sgst, SUM(c.igst) as igst`,
        table_name,
        whr,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0 ? grandTotalsQuery.msg[0] : {};

      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        suc: res_dt.suc > 0 ? 1 : 0,
        grandTotals: grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, msg: [] });
    }
  },
);

reportRouter.post(
  "/get_shift_wise_repo_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      var data = req.body;
      var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) AS advance_amt, SUM(c.base_amt) base_amt, SUM(c.cgst) cgst, SUM(c.sgst) sgst, SUM(c.igst) igst, f.operator_name opratorName, g.shift_name, g.f_time, g.t_time`,
        table_name =
          "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f, md_shift g",
        whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.customer_id = g.customer_id AND TIME(b.date_time_out) BETWEEN g.f_time AND g.t_time AND a.car_out_flag = 'Y' AND a.intype='${data.intype}' AND b.date_time_out BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND a.customer_id = '${data.custId}'`,
        order =
          "GROUP BY a.user_id_in, b.device_id, d.vehicle_name, f.operator_name, g.shift_name, g.f_time, g.t_time ORDER BY g.f_time";

      var res_dt = await db_Select(select, table_name, whr, order);
      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [] });
    }
  },
);

reportRouter.post("/shift_wise_repo", AuthCheckedMW, async (req, res) => {
  var custId = req.session.user.user_data.customer_id,
    userType = req.session.user.user_data.user_type;

  var data = req.body;

  let shift_time = await db_Select(
    "f_time, t_time",
    "md_shift",
    `shift_id=${data.shift_id}`,
    null,
  );
  let ftime = shift_time.msg[0].f_time;
  let ttime = shift_time.msg[0].t_time;

  if (data.pay_mode == "A") {
    var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, c.pay_mode,SUM(c.cgst) cgst,SUM(c.sgst) sgst, f.operator_name opratorName`,
      table_name =
        "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
      whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND DATE(b.date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND TIME(b.date_time_out) BETWEEN '${ftime}' AND '${ttime}' AND a.customer_id = '${custId}'`,
      order = "GROUP BY a.user_id_in,c.pay_mode";
    var res_dt = await db_Select(select, table_name, whr, order);
    res.send(res_dt);
  } else {
    var select = `b.device_id mc_srl_no_out, d.vehicle_name vehicleType, COUNT(b.receipt_no) tot_vehi, SUM(c.paid_amt) paid_amt, SUM(c.advance_amt) advance_amt, SUM(c.base_amt) base_amt, c.pay_mode,SUM(c.cgst) cgst,SUM(c.sgst) sgst, f.operator_name opratorName`,
      table_name =
        "td_vehicle_in a, td_vehicle_out b, td_receipt c, md_vehicle d, md_user e, md_operator f",
      whr = `a.receipt_no=b.receipt_no AND a.receipt_no=c.receipt_no AND a.vehicle_id=d.vehicle_id AND a.user_id_in=e.id AND e.user_id=f.user_id AND a.car_out_flag = 'Y' AND DATE(b.date_time_out) BETWEEN '${data.frm_dt}' AND '${data.to_dt}' AND TIME(b.date_time_out) BETWEEN '${ftime}' AND '${ttime}' AND a.customer_id = '${custId}' AND c.pay_mode = '${data.pay_mode}'`,
      order = "GROUP BY a.user_id_in";
    var res_dt = await db_Select(select, table_name, whr, order);
    res.send(res_dt);
  }
});

reportRouter.get("/summary_report", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var custId = customer.length > 0 ? customer[0].cust_id : null;
  var operator = [];
  if (custId) {
    operator = await getoperatorlist(custId); // ✅ pass customer id
  }

  var data = {
    title: "Summary Report",
    page_path: "reports/summary_report.ejs",
    dtFormat: dateFormat,
    data: customer,
    operators: operator,
  };
  res.render("common/layouts/main", data);
});

reportRouter.get("/monthly_subscription", AuthCheckedMW, async (req, res) => {
  var customer = await getcustomerlist();
  var custId = customer.length > 0 ? customer[0].cust_id : null;
  var operator = [];
  if (custId) {
    operator = await getoperatorlist(custId); // ✅ pass customer id
  }

  var data = {
    title: "Monthly Subscription Report",
    page_path: "reports/monthly_subscription_report.ejs",
    dtFormat: dateFormat,
    data: customer,
    operators: operator,
  };
  res.render("common/layouts/main", data);
});

reportRouter.post(
  "/monthly_subscription_report",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      const normalizeDateTime = (value, isEnd = false) => {
        if (!value) return value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value + (isEnd ? " 23:59:59" : " 00:00:00");
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
          return value.replace("T", " ") + ":00";
        }
        return value.replace("T", " ");
      };

      const frmDt = normalizeDateTime(data.frm_dt, false);
      const toDt = normalizeDateTime(data.to_dt, true);
      // filter by subscription end date range for upcoming expiries
      let where = `end_date BETWEEN '${frmDt}' AND '${toDt}'`;

      if (data.custId) {
        where += ` AND customer_id='${data.custId}'`;
      }

      if (data.pay_mode && data.pay_mode !== "A") {
        where += ` AND pay_mode='${data.pay_mode}'`;
      }

      if (data.vehicle_no) {
        where += ` AND vehicle_no LIKE '%${data.vehicle_no}%'`;
      }

      if (data.search && data.search.value) {
        const searchValue = data.search.value;
        where += ` AND (vehicle_no LIKE '%${searchValue}%' OR receipt_no LIKE '%${searchValue}%')`;
      }

      const table_name = "td_vehicle_subscription";
      // include remaining_days (days until end_date) and order by nearest expiry
      const select = `id, user_id_in, vehicle_id, customer_id, device_id, vehicle_no, subscription_type, start_date, end_date, no_of_days, base_amt, cgst, sgst, igst, paid_amt, pay_mode, receipt_no, status, created_by, created_at, updated_at, DATEDIFF(end_date, CURDATE()) AS remaining_days`;

      const totalRec = await db_Select(
        "COUNT(*) as count",
        table_name,
        where,
        null,
      );
      const totalRecords = totalRec.suc > 0 ? totalRec.msg[0].count : 0;

      const orderLimit = `ORDER BY DATEDIFF(end_date, CURDATE()) ASC, end_date ASC LIMIT ${start}, ${length}`;
      const res_dt = await db_Select(select, table_name, where, orderLimit);

      const totalsQuery = await db_Select_Sqery(
        `
          SELECT
            SUM(t.base_amt) AS base_amt,
            SUM(t.cgst) AS cgst,
            SUM(t.sgst) AS sgst,
            SUM(t.igst) AS igst,
            SUM(t.paid_amt) AS paid_amt,
            SUM(CASE WHEN UPPER(t.pay_mode) = 'U' THEN t.paid_amt ELSE 0 END) AS tot_upi,
            SUM(CASE WHEN UPPER(t.pay_mode) = 'C' THEN t.paid_amt ELSE 0 END) AS tot_cash,
            SUM(t.paid_amt) AS tot_amt
          FROM (
            SELECT base_amt, cgst, sgst, igst, paid_amt, pay_mode
            FROM ${table_name}
            WHERE ${where}
            ORDER BY created_at DESC
            LIMIT ${start}, ${length}
          ) AS t
        `,
      );

      const totals =
        totalsQuery.suc > 0
          ? totalsQuery.msg[0]
          : {
              base_amt: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              paid_amt: 0,
              tot_upi: 0,
              tot_cash: 0,
              tot_amt: 0,
            };

      const grandTotalsQuery = await db_Select(
        `SUM(base_amt) AS base_amt, SUM(cgst) AS cgst, SUM(sgst) AS sgst, SUM(igst) AS igst, SUM(paid_amt) AS paid_amt, SUM(CASE WHEN UPPER(pay_mode) = 'U' THEN paid_amt ELSE 0 END) AS tot_upi, SUM(CASE WHEN UPPER(pay_mode) = 'C' THEN paid_amt ELSE 0 END) AS tot_cash, SUM(paid_amt) AS tot_amt`,
        table_name,
        where,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0
          ? grandTotalsQuery.msg[0]
          : {
              base_amt: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              paid_amt: 0,
              tot_upi: 0,
              tot_cash: 0,
              tot_amt: 0,
            };

      res.json({
        draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        totals,
        grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Server error" });
    }
  },
);

reportRouter.post(
  "/get_monthly_subscription_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const data = req.body;

      const normalizeDateTime = (value, isEnd = false) => {
        if (!value) return value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value + (isEnd ? " 23:59:59" : " 00:00:00");
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
          return value.replace("T", " ") + ":00";
        }
        return value.replace("T", " ");
      };

      const frmDt = normalizeDateTime(data.frm_dt, false);
      const toDt = normalizeDateTime(data.to_dt, true);

      let where = `created_at BETWEEN '${frmDt}' AND '${toDt}'`;

      if (data.custId) {
        where += ` AND customer_id='${data.custId}'`;
      }

      if (data.pay_mode && data.pay_mode !== "A") {
        where += ` AND pay_mode='${data.pay_mode}'`;
      }

      if (data.vehicle_no) {
        where += ` AND vehicle_no LIKE '%${data.vehicle_no}%'`;
      }

      if (data.search && data.search.value) {
        const searchValue = data.search.value;
        where += ` AND (vehicle_no LIKE '%${searchValue}%' OR receipt_no LIKE '%${searchValue}%')`;
      }

      const table_name = "td_vehicle_subscription";
      const select = `id, receipt_no, user_id_in, vehicle_id, customer_id, device_id, vehicle_no, subscription_type, start_date, end_date, no_of_days, base_amt, cgst, sgst, igst, paid_amt, pay_mode, status, created_by, created_at, updated_at`;
      const order = `ORDER BY created_at DESC`;

      const res_dt = await db_Select(select, table_name, where, order);

      const totals = await db_Select(
        `SUM(base_amt) AS base_amt, SUM(cgst) AS cgst, SUM(sgst) AS sgst, SUM(igst) AS igst, SUM(paid_amt) AS paid_amt, SUM(CASE WHEN UPPER(pay_mode) = 'U' THEN paid_amt ELSE 0 END) AS tot_upi, SUM(CASE WHEN UPPER(pay_mode) = 'C' THEN paid_amt ELSE 0 END) AS tot_cash, SUM(paid_amt) AS tot_amt`,
        table_name,
        where,
        null,
      );

      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        totals:
          totals.suc > 0
            ? totals.msg[0]
            : {
                base_amt: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                paid_amt: 0,
                tot_upi: 0,
                tot_cash: 0,
                tot_amt: 0,
              },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [], totals: {} });
    }
  },
);

reportRouter.get(
  "/upcoming_subscription_expiry",
  AuthCheckedMW,
  async (req, res) => {
    var customer = await getcustomerlist();
    var custId = customer.length > 0 ? customer[0].cust_id : null;
    var operator = [];
    if (custId) {
      operator = await getoperatorlist(custId); // ✅ pass customer id
    }

    var data = {
      title: "Upcoming Subscription Expiry Report / Expired Subscription",
      page_path: "reports/upcoming_subscription_expiry_report.ejs",
      dtFormat: dateFormat,
      data: customer,
      operators: operator,
    };
    res.render("common/layouts/main", data);
  },
);

reportRouter.post(
  "/upcoming_subscription_expiry",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const data = req.body;
      const draw = parseInt(data.draw) || 1;
      const start = parseInt(data.start) || 0;
      const length = parseInt(data.length) || 50;

      const normalizeDateTime = (value, isEnd = false) => {
        if (!value) return value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value + (isEnd ? " 23:59:59" : " 00:00:00");
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
          return value.replace("T", " ") + ":00";
        }
        return value.replace("T", " ");
      };

      //   const frmDt = normalizeDateTime(data.frm_dt, false);
      //  const toDt = normalizeDateTime(data.to_dt, true);
      // filter by subscription end date range for upcoming expiries
      var exp_type = data.exp_type;
      console.log(exp_type, "EXPIRY TYPE------------------");
      let where;
      if (exp_type == 2) {
        where = `end_date <= CURDATE() AND status='E' `;
      } else {
        where = `end_date >= CURDATE()`;
      }

      if (data.custId) {
        where += ` AND customer_id='${data.custId}'`;
      }

      if (data.pay_mode && data.pay_mode !== "A") {
        where += ` AND pay_mode='${data.pay_mode}'`;
      }

      if (data.vehicle_no) {
        where += ` AND vehicle_no LIKE '%${data.vehicle_no}%'`;
      }

      if (data.search && data.search.value) {
        const searchValue = data.search.value;
        where += ` AND (vehicle_no LIKE '%${searchValue}%' OR receipt_no LIKE '%${searchValue}%')`;
      }

      const table_name = "td_vehicle_subscription";
      // include remaining_days (days until end_date) and order by nearest expiry
      const select = `id, user_id_in, vehicle_id, customer_id, device_id, vehicle_no, subscription_type, start_date, end_date, no_of_days, base_amt, cgst, sgst, igst, paid_amt, pay_mode, receipt_no, status, created_by, created_at, updated_at, DATEDIFF(end_date, CURDATE()) AS remaining_days`;

      const totalRec = await db_Select(
        "COUNT(*) as count",
        table_name,
        where,
        null,
      );
      const totalRecords = totalRec.suc > 0 ? totalRec.msg[0].count : 0;

      const orderLimit = `ORDER BY DATEDIFF(end_date, CURDATE()) ASC, end_date ASC LIMIT ${start}, ${length}`;
      const res_dt = await db_Select(select, table_name, where, orderLimit);

      const totalsQuery = await db_Select_Sqery(
        `
          SELECT
            SUM(t.base_amt) AS base_amt,
            SUM(t.cgst) AS cgst,
            SUM(t.sgst) AS sgst,
            SUM(t.igst) AS igst,
            SUM(t.paid_amt) AS paid_amt,
            SUM(CASE WHEN UPPER(t.pay_mode) = 'U' THEN t.paid_amt ELSE 0 END) AS tot_upi,
            SUM(CASE WHEN UPPER(t.pay_mode) = 'C' THEN t.paid_amt ELSE 0 END) AS tot_cash,
            SUM(t.paid_amt) AS tot_amt
          FROM (
            SELECT base_amt, cgst, sgst, igst, paid_amt, pay_mode
            FROM ${table_name}
            WHERE ${where}
            ORDER BY created_at DESC
            LIMIT ${start}, ${length}
          ) AS t
        `,
      );

      const totals =
        totalsQuery.suc > 0
          ? totalsQuery.msg[0]
          : {
              base_amt: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              paid_amt: 0,
              tot_upi: 0,
              tot_cash: 0,
              tot_amt: 0,
            };

      const grandTotalsQuery = await db_Select(
        `SUM(base_amt) AS base_amt, SUM(cgst) AS cgst, SUM(sgst) AS sgst, SUM(igst) AS igst, SUM(paid_amt) AS paid_amt, SUM(CASE WHEN UPPER(pay_mode) = 'U' THEN paid_amt ELSE 0 END) AS tot_upi, SUM(CASE WHEN UPPER(pay_mode) = 'C' THEN paid_amt ELSE 0 END) AS tot_cash, SUM(paid_amt) AS tot_amt`,
        table_name,
        where,
        null,
      );
      const grandTotals =
        grandTotalsQuery.suc > 0
          ? grandTotalsQuery.msg[0]
          : {
              base_amt: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              paid_amt: 0,
              tot_upi: 0,
              tot_cash: 0,
              tot_amt: 0,
            };

      res.json({
        draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        totals,
        grandTotals,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Server error" });
    }
  },
);

reportRouter.post(
  "/get_upcoming_subscription_expiry_excel",
  AuthCheckedMW,
  async (req, res) => {
    try {
      const data = req.body;
      let where = `end_date >= CURDATE()`;
      if (data.custId) {
        where += ` AND customer_id='${data.custId}'`;
      }
      if (data.pay_mode && data.pay_mode !== "A") {
        where += ` AND pay_mode='${data.pay_mode}'`;
      }
      if (data.vehicle_no) {
        where += ` AND vehicle_no LIKE '%${data.vehicle_no}%'`;
      }

      if (data.search && data.search.value) {
        const searchValue = data.search.value;
        where += ` AND (vehicle_no LIKE '%${searchValue}%' OR receipt_no LIKE '%${searchValue}%')`;
      }

      const table_name = "td_vehicle_subscription";
      const select = `id, receipt_no, user_id_in, vehicle_id, customer_id, device_id, vehicle_no, subscription_type, start_date, end_date, no_of_days, base_amt, cgst, sgst, igst, paid_amt, pay_mode, status, created_by, created_at, updated_at, DATEDIFF(end_date, CURDATE()) AS remaining_days`;
      const order = `ORDER BY created_at DESC`;

      const res_dt = await db_Select(select, table_name, where, order);

      const totals = await db_Select(
        `SUM(base_amt) AS base_amt, SUM(cgst) AS cgst, SUM(sgst) AS sgst, SUM(igst) AS igst, SUM(paid_amt) AS paid_amt, SUM(CASE WHEN UPPER(pay_mode) = 'U' THEN paid_amt ELSE 0 END) AS tot_upi, SUM(CASE WHEN UPPER(pay_mode) = 'C' THEN paid_amt ELSE 0 END) AS tot_cash, SUM(paid_amt) AS tot_amt`,
        table_name,
        where,
        null,
      );

      res.json({
        suc: res_dt.suc > 0 ? 1 : 0,
        data: res_dt.suc > 0 ? res_dt.msg : [],
        totals:
          totals.suc > 0
            ? totals.msg[0]
            : {
                base_amt: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                paid_amt: 0,
                tot_upi: 0,
                tot_cash: 0,
                tot_amt: 0,
              },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ suc: 0, data: [], totals: {} });
    }
  },
);

module.exports = { reportRouter };
