const dateFormat = require("dateformat");
// const { db_Insert } = require('../model/Master.model');
const { db_Insert, db_Select } = require("../../model/Master.model");

const vehicle_in = (
  userData,
  vehicle_id,
  vehicle_no,
  dev_mod,
  receipt_type,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let receipt_number = new Date().getTime();

      // **********  10/07/2026  Code For serial Number ****  //

      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = yy + mm;

      let get_max_slno = await db_Select(
        "MAX(serial_no) AS last_serial",
        "td_vehicle_in",
        `serial_no LIKE '${prefix}%'`,
        null,
      );
      console.log("🚗 Vehicle In - Module in:", get_max_slno);
      //let serial_no;

      const lastSerial = get_max_slno?.msg?.[0]?.last_serial;

      const serial_no = lastSerial
        ? (parseInt(lastSerial, 10) + 1).toString()
        : prefix + "0000001";

      // **********  10/07/2026  Code For serial Number ****  //

      let vehicle_in_fields = `(user_id_in, vehicle_id, customer_id, device_id, vehicle_no, date_time_in, oprn_mode, receipt_type, receipt_no, serial_no, created_at)`;
      let vehicle_in_values = `(${userData.id}, ${vehicle_id}, ${userData.customer_id}, '${userData.device_id}', '${vehicle_no}', '${datetime}', '${dev_mod}', '${receipt_type}', ${receipt_number}, '${serial_no}', '${datetime}')`;

      let td_vehicle_in = await db_Insert(
        "td_vehicle_in",
        vehicle_in_fields,
        vehicle_in_values,
        null,
        0,
      );
      let insertData = { td_vehicle_in, receipt_number, serial_no };
      resolve(insertData);
    } catch (error) {
      reject(error);
    }
  });
};
const vehicle_subscription_in = (
  userData,
  vehicle_id,
  vehicle_no,
  mst_id,
  no_of_days,
  base_amt,
  cgst,
  sgst,
  igst,
  paid_amt,
  paymode,
  dev_mod,
  receipt_type,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let receipt_number = new Date().getTime();

      // **********  10/07/2026  Code For serial Number ****  //

      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = "M";
      // let get_max_slno = await db_Select(
      //   "MAX(receipt_no) AS last_serial",
      //   "td_vehicle_subscription",
      //   `receipt_no LIKE '${prefix}%'`,
      //   null,
      // );
      // console.log("🚗 Vehicle In - Module in:", get_max_slno);
      //let serial_no;
      //const lastSerial = get_max_slno?.msg?.[0]?.last_serial;

      // const serial_no = lastSerial ? prefix +
      //     String(parseInt(lastSerial.replace(prefix, "")) + 1).padStart(6, "0")
      //   : prefix + "000001";

      const serial_no = prefix + receipt_number;

      // **********  10/07/2026  Code For serial Number ****  //

      // ***** Code for cgst,sgst,igst back calculation 23/07/2026  code  ******

      var price = 0;
      var price_values = 0;
      var tax_amount = 0;
      var cgsts = 0;
      var sgsts = 0;
      var igsts = 0;
      var base_amt = 0;

      if (parseFloat(igst) > 0) {
        price = 1 + parseFloat(igst) / 100;
        console.log("IGST price:", price);

        price_values = paid_amt / price;
        var price_value = parseFloat(price_values.toFixed(2));
        console.log(price_value, "igst price_value");

        tax_amount = parseFloat(paid_amt) - parseFloat(price_value);
        console.log(tax_amount, "igst tax_amount");

        igsts = parseFloat(tax_amount.toFixed(2));
        console.log(igsts, "igst");

        base_amt = parseFloat(paid_amt) - parseFloat(igsts);
        console.log(base_amt, "base igst");
      } else {
        price = 1 + (parseFloat(cgst) + parseFloat(sgst)) / 100;
        console.log(cgst, sgst, cgst + sgst / 100, price, "price");

        price_values = paid_amt / price;
        var price_value = parseFloat(price_values.toFixed(2));
        console.log(price_value, "price_value");

        tax_amount = parseFloat(paid_amt) - parseFloat(price_value);
        console.log(tax_amount, "tax_amount");

        cgsts = parseFloat((tax_amount / 2).toFixed(2));
        sgsts = parseFloat((tax_amount / 2).toFixed(2));
        console.log(cgsts, sgsts, "csgst");

        var base_amt =
          parseFloat(paid_amt) - (parseFloat(cgsts) + parseFloat(sgsts));
        console.log(base_amt, "base");
      }
      // ***** Code for cgst,sgst,igst back calculation 23/07/2026  code  ******

      const start_date = dateFormat(new Date(), "yyyy-mm-dd");
      const date = new Date();
      // Add the specified number of days
      date.setDate(date.getDate() + parseInt(no_of_days));
      const end_date = dateFormat(date, "yyyy-mm-dd");
      console.log(paid_amt);
      let vehicle_in_fields = `(user_id_in, vehicle_id, customer_id, device_id, vehicle_no, subscription_type ,start_date ,end_date,
      no_of_days, base_amt, cgst, sgst,igst,paid_amt,pay_mode,receipt_no, status,created_by,created_at)`;
      let vehicle_in_values = `(${userData.id}, ${vehicle_id}, ${userData.customer_id}, '${userData.device_id}', '${vehicle_no}','${mst_id}', '${start_date}','${end_date}','${no_of_days}','${base_amt}','${cgsts}','${sgsts}','${igsts}','${paid_amt}','${paymode}', '${serial_no}',
      'A','${userData.id}','${datetime}')`;

      let td_vehicle_in = await db_Insert(
        "td_vehicle_subscription",
        vehicle_in_fields,
        vehicle_in_values,
        null,
        0,
      );
      //  console.log(td_vehicle_in.lastId.insertId, "fffffffff");
      var result = await db_Select(
        "a.customer_id,a.device_id,a.vehicle_no,a.start_date,a.end_date,a.no_of_days,a.base_amt,a.cgst,a.sgst,a.igst,a.paid_amt,a.pay_mode,a.receipt_no as receipt_number,b.vehicle_name,a.created_at as billing_datetime",
        "td_vehicle_subscription a ,md_vehicle b",
        `a.vehicle_id=b.vehicle_id AND id=${td_vehicle_in.lastId.insertId}`,
        null,
      );
      const result_data = result.msg[0];

      let insertData = {
        td_vehicle_in,
        result_data,
      };
      resolve(insertData);
    } catch (error) {
      reject(error);
    }
  });
};

//   Car in form Monthly data //
const vehicle_in_monthly = (
  userData,
  vehicle_id,
  vehicle_no,
  monthly_bill_receipt,
  subscription_end_date,
  dev_mod,
  receipt_type,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let receipt_number = new Date().getTime();

      // **********  10/07/2026  Code For serial Number ****  //

      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = yy + mm;

      let get_max_slno = await db_Select(
        "MAX(serial_no) AS last_serial",
        "td_vehicle_in",
        `serial_no LIKE '${prefix}%'`,
        null,
      );
      console.log("🚗 Vehicle In - Module in:", get_max_slno);
      //let serial_no;

      const lastSerial = get_max_slno?.msg?.[0]?.last_serial;

      const serial_no = lastSerial
        ? (parseInt(lastSerial, 10) + 1).toString()
        : prefix + "0000001";

      // **********  10/07/2026  Code For serial Number ****  //

      let vehicle_in_fields = `(user_id_in, vehicle_id, customer_id, device_id, vehicle_no, date_time_in, oprn_mode, receipt_type, receipt_no, serial_no,intype,monthly_bill_no, created_at)`;
      let vehicle_in_values = `(${userData.id}, ${vehicle_id}, ${userData.customer_id}, '${userData.device_id}', '${vehicle_no}', '${datetime}', '${dev_mod}', '${receipt_type}', ${receipt_number}, '${serial_no}','M','${monthly_bill_receipt}','${datetime}')`;

      let td_vehicle_in = await db_Insert(
        "td_vehicle_in",
        vehicle_in_fields,
        vehicle_in_values,
        null,
        0,
      );
      let insertData = {
        td_vehicle_in,
        receipt_number,
        serial_no,
        monthly_bill_receipt,
        subscription_end_date,
      };
      resolve(insertData);
    } catch (error) {
      reject(error);
    }
  });
};

const insert_receipt = (
  userData,
  receipt_no,
  base_amt,
  cgst,
  sgst,
  igst,
  paid_amt,
  gst_flag,
  trans_flag,
  paymode,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      //02.12.2024//

      var price = 0;
      var price_values = 0;
      var tax_amount = 0;
      var cgsts = 0;
      var sgsts = 0;
      var igsts = 0;

      // added igst in 08.04.2026

      if (parseFloat(igst) > 0) {
        price = 1 + parseFloat(igst) / 100;
        console.log("IGST price:", price);

        price_values = paid_amt / price;
        var price_value = parseFloat(price_values.toFixed(2));
        console.log(price_value, "igst price_value");

        tax_amount = parseFloat(paid_amt) - parseFloat(price_value);
        console.log(tax_amount, "igst tax_amount");

        igsts = parseFloat(tax_amount.toFixed(2));
        console.log(igsts, "igst");

        base_amt = parseFloat(paid_amt) - parseFloat(igsts);
        console.log(base_amt, "base igst");
      } else {
        price = 1 + (parseFloat(cgst) + parseFloat(sgst)) / 100;
        console.log(cgst, sgst, cgst + sgst / 100, price, "price");

        price_values = paid_amt / price;
        var price_value = parseFloat(price_values.toFixed(2));
        console.log(price_value, "price_value");

        tax_amount = parseFloat(paid_amt) - parseFloat(price_value);
        console.log(tax_amount, "tax_amount");

        cgsts = parseFloat((tax_amount / 2).toFixed(2));
        sgsts = parseFloat((tax_amount / 2).toFixed(2));
        console.log(cgsts, sgsts, "csgst");

        var base_amt =
          parseFloat(paid_amt) - (parseFloat(cgsts) + parseFloat(sgsts));
        console.log(base_amt, "base");
      }

      let receipt_fields = `(receipt_no, user_id, base_amt, cgst, sgst, igst, paid_amt, gst_flag, trans_flag, pay_mode, created_at)`,
        receipt_values = `(${receipt_no},${userData.id},${base_amt},${cgsts}, ${sgsts}, ${igsts}, ${paid_amt}, '${gst_flag}', '${trans_flag}', '${paymode}', '${datetime}')`;
      var receipt = await db_Insert(
        "td_receipt",
        receipt_fields,
        receipt_values,
        null,
        0,
      );
      resolve(receipt);
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
};

const insert_advance_receipt_update = (
  userData,
  receipt_no,
  base_amt,
  advance_amt,
  cgst,
  sgst,
  igst,
  paid_amt,
  gst_flag,
  trans_flag,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      let receipt_fields = `(receipt_no, user_id, base_amt, advance_amt, cgst, sgst, igst, paid_amt, gst_flag, trans_flag, created_at)`,
        receipt_values = `(${receipt_no},${userData.id},${base_amt},${advance_amt},${cgst}, ${sgst},  ${igst}, ${paid_amt}, '${gst_flag}', '${trans_flag}','${datetime}')`;
      var receipt = await db_Insert(
        "td_receipt",
        receipt_fields,
        receipt_values,
        null,
        0,
      );
      resolve(receipt);
    } catch (error) {
      reject(error);
    }
  });
};

const outpass_advance_receipt_update = (
  userData,
  receipt_no,
  base_amt,
  cgst,
  sgst,
  igst,
  paid_amt,
  gst_flag,
  trans_flag,
  paymode,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      let receipt_fields = `user_id=${userData.id}, base_amt=${base_amt}, cgst=${cgst}, sgst=${sgst}, igst=${igst}, paid_amt=${paid_amt}, gst_flag='${gst_flag}', trans_flag='${trans_flag}', pay_mode = '${paymode}', updated_at='${datetime}'`,
        where = `receipt_no='${receipt_no}'`;
      var receipt_update = await db_Insert(
        "td_receipt",
        receipt_fields,
        null,
        where,
        1,
      );
      resolve(receipt_update);
    } catch (error) {
      reject(error);
    }
  });
};

const insert_vehicle_outpass = (
  userData,
  device_id,
  date_time_out,
  receipt_no,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      let fields = `(user_id, device_id, date_time_out, receipt_no, created_at, updated_at)`,
        values = `(${userData.id},'${device_id}','${date_time_out}', '${receipt_no}','${datetime}','${datetime}')`;
      var data = await db_Insert("td_vehicle_out", fields, values, null, 0);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

// const update_car_in_flag = (userData, vehicle_id, vehicle_no,receipt_no) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let values = `car_out_flag = "Y"`,
//                 whr = `vehicle_id = '${vehicle_id}' AND customer_id=${userData.customer_id} AND vehicle_no='${vehicle_no}' AND receipt_no='${receipt_no}' AND car_out_flag='N'`;
//             var data = await db_Insert("td_vehicle_in", values, null, whr, 1);
//             resolve(data);
//         } catch (error) {

//             reject(error);
//         }
//     });
// }

const update_car_in_flag = (userData, vehicle_id, vehicle_no, receipt_no) => {
  return new Promise(async (resolve, reject) => {
    try {
      let values = `car_out_flag = "Y"`,
        whr = `customer_id=${userData.customer_id} AND receipt_no='${receipt_no}' AND car_out_flag='N'`;
      var data = await db_Insert("td_vehicle_in", values, null, whr, 1);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  vehicle_in,
  vehicle_subscription_in,
  vehicle_in_monthly,
  insert_receipt,
  insert_vehicle_outpass,
  update_car_in_flag,
  insert_advance_receipt_update,
  outpass_advance_receipt_update,
};
