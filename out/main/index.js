import { app as app$1, BrowserWindow as BrowserWindow$1, nativeTheme as nativeTheme$1, ipcMain as ipcMain$1, Menu } from "electron";
import { shell } from "electron/common";
import { dirname, join, resolve } from "node:path";
import { networkInterfaces } from "node:os";
import { BrowserWindow, nativeTheme, ipcMain, app, net } from "electron/main";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { execFile, exec } from "node:child_process";
import { access, constants, rm, mkdir, cp } from "node:fs/promises";
import Store from "electron-store";
import { fileURLToPath, URL } from "node:url";
import { sqliteTable, int, text, numeric, unique } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as sql from "drizzle-orm";
import Excel from "@yanglee2421/exceljs";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const printer = "printer";
const verifyActivation$1 = "verifyActivation";
const getDataFromAccessDatabase$1 = "getDataFromAccessDatabase";
const autoInputToVC$1 = "autoInputToVC";
const hxzy_hmis_api_get = "hxzy_hmis_get_data";
const hxzy_hmis_api_set = "hxzy_hmis_save_data";
const hxzy_hmis_api_verifies = "hxzy_hmis_upload_verifies";
const hxzy_hmis_setting = "hxzy_hmis_setting";
const hxzy_hmis_sqlite_get = "hxzy_hmis_sqlite_get";
const hxzy_hmis_sqlite_delete = "hxzy_hmis_sqlite_delete";
const jtv_hmis_api_get = "jtv_hmis_get_data";
const jtv_hmis_api_set = "jtv_hmis_save_data";
const jtv_hmis_setting = "jtv_hmis_setting";
const jtv_hmis_sqlite_get = "jtv_hmis_sqlite_get";
const jtv_hmis_sqlite_delete = "jtv_hmis_sqlite_delete";
const jtv_hmis_xuzhoubei_api_get = "jtv_hmis_xuzhoubei_get_data";
const jtv_hmis_xuzhoubei_api_set = "jtv_hmis_xuzhoubei_save_data";
const jtv_hmis_xuzhoubei_setting = "jtv_hmis_xuzhoubei_setting";
const jtv_hmis_xuzhoubei_sqlite_get = "jtv_hmis_xuzhoubei_sqlite_get";
const jtv_hmis_xuzhoubei_sqlite_delete = "jtv_hmis_xuzhoubei_sqlite_delete";
const kh_hmis_api_get = "kh_hmis_get_data";
const kh_hmis_api_set = "kh_hmis_save_data";
const kh_hmis_setting = "kh_hmis_setting";
const kh_hmis_sqlite_get = "kh_hmis_sqlite_get";
const kh_hmis_sqlite_delete = "kh_hmis_sqlite_delete";
const log$1 = "log";
const mem = "mem";
const openAtLogin = "openAtLogin";
const openDevTools = "openDevTools";
const openPath = "openPath";
const windowFocus = "windowFocus";
const windowBlur = "windowBlur";
const windowShow = "windowShow";
const windowHide = "windowHide";
const getVersion = "getVersion";
const mobileMode = "mobileMode";
const settings$1 = "settings";
const settingsOpenInEditor = "settingsOpenInEditor";
const xlsx_chr_501 = "excel:verify";
const xlsx_chr_502 = "excel:quartor";
const xlsx_chr_53a = "excel:detection";
const sqlite_xlsx_size_c = "sqlite:xlsxSize:create";
const sqlite_xlsx_size_u = "sqlite:xlsxSize:update";
const sqlite_xlsx_size_r = "sqlite:xlsxSize:read";
const sqlite_xlsx_size_d = "sqlite:xlsxSize:delete";
const log = (message, type = "info") => {
  const data = {
    id: 0,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    message,
    type
  };
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(log$1, data);
  });
};
const errorToMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
};
const withLog = (fn) => {
  const fnWithLog = async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(error);
      const message = errorToMessage(error);
      log(message, "error");
      throw message;
    }
  };
  return fnWithLog;
};
const getIP = () => {
  const interfaces = networkInterfaces();
  const IP = Object.values(interfaces).flat().find((i) => {
    if (!i) return false;
    if (i.family !== "IPv4") {
      return false;
    }
    if (i.address === "192.168.1.100") {
      return false;
    }
    return !i.internal;
  })?.address;
  return IP || "";
};
const getDirection = (nBoard) => {
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};
const createEmit = (channel2) => {
  return (data) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel2, data);
    });
  };
};
const settings = new Store({
  name: "settings",
  schema: {
    databasePath: {
      type: "string",
      default: ""
    },
    driverPath: {
      type: "string",
      default: ""
    },
    activateCode: {
      type: "string",
      default: ""
    },
    alwaysOnTop: {
      type: "boolean",
      default: false
    },
    mode: {
      type: "string",
      default: "system",
      enum: ["system", "light", "dark"]
    },
    homePath: {
      type: "string",
      default: "/settings"
    }
  }
});
const hxzy_hmis = new Store({
  name: "hxzy_hmis",
  schema: {
    host: {
      type: "string",
      default: ""
    },
    autoInput: {
      type: "boolean",
      default: false
    },
    autoUpload: {
      type: "boolean",
      default: false
    },
    autoUploadInterval: {
      type: "number",
      default: 30
    },
    gd: {
      type: "string",
      default: ""
    }
  }
});
const jtv_hmis_xuzhoubei = new Store({
  name: "jtv_hmis_xuzhoubei",
  schema: {
    host: {
      type: "string",
      default: ""
    },
    autoInput: {
      type: "boolean",
      default: false
    },
    autoUpload: {
      type: "boolean",
      default: false
    },
    autoUploadInterval: {
      type: "number",
      default: 30
    },
    username_prefix: {
      type: "string",
      default: ""
    }
  }
});
const jtv_hmis = new Store({
  name: "jtv_hmis",
  schema: {
    host: {
      type: "string",
      default: ""
    },
    autoInput: {
      type: "boolean",
      default: false
    },
    autoUpload: {
      type: "boolean",
      default: false
    },
    autoUploadInterval: {
      type: "number",
      default: 30
    },
    unitCode: {
      type: "string",
      default: ""
    }
  }
});
const kh_hmis = new Store({
  name: "kh_hmis",
  schema: {
    host: {
      type: "string",
      default: ""
    },
    autoInput: {
      type: "boolean",
      default: false
    },
    autoUpload: {
      type: "boolean",
      default: false
    },
    autoUploadInterval: {
      type: "number",
      default: 30
    },
    tsgz: {
      type: "string",
      default: ""
    },
    tszjy: {
      type: "string",
      default: ""
    },
    tsysy: {
      type: "string",
      default: ""
    }
  }
});
const initDidChange = () => {
  settings.onDidChange("alwaysOnTop", (value) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.setAlwaysOnTop(!!value);
    });
  });
  settings.onDidChange("mode", (value) => {
    if (!value) return;
    nativeTheme.themeSource = value;
  });
};
const initIpc$7 = () => {
  ipcMain.handle(
    settings$1,
    withLog(async (e, data) => {
      void e;
      if (data) {
        settings.set(data);
      }
      return settings.store;
    })
  );
  ipcMain.handle(
    settingsOpenInEditor,
    withLog(async () => {
      await settings.openInEditor();
    })
  );
};
const init$4 = () => {
  initDidChange();
  initIpc$7();
};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dayjs_min$1 = { exports: {} };
var dayjs_min = dayjs_min$1.exports;
var hasRequiredDayjs_min;
function requireDayjs_min() {
  if (hasRequiredDayjs_min) return dayjs_min$1.exports;
  hasRequiredDayjs_min = 1;
  (function(module, exports) {
    !function(t, e) {
      module.exports = e();
    }(dayjs_min, function() {
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          }(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t2), l2 = function(t3, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, function(t3, r3) {
            return r3 || function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            }(t3) || i2.replace(":", "");
          });
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      }(), k = _.prototype;
      return O.prototype = k, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach(function(t2) {
        k[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      }), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    });
  })(dayjs_min$1);
  return dayjs_min$1.exports;
}
var dayjs_minExports = requireDayjs_min();
const dayjs = /* @__PURE__ */ getDefaultExportFromCjs(dayjs_minExports);
const execFileAsync$1 = promisify(execFile);
const DATE_FORMAT_DATABASE = "YYYY/MM/DD HH:mm:ss";
const execFileAsyncWithRetry = async (driverPath, args) => {
  try {
    const data = await execFileAsync$1(driverPath, args);
    if (data.stderr) {
      throw new Error(data.stderr);
    }
    return data;
  } catch {
    const driverDir = dirname(driverPath);
    const newDriverDir = join(
      app.getPath("temp"),
      "wtxy_tookit_cmd",
      `${Date.now()}`
    );
    try {
      await access(newDriverDir, constants.R_OK);
    } catch {
      await rm(resolve(newDriverDir, "../"), { recursive: true, force: true });
      await mkdir(newDriverDir, { recursive: true });
    }
    await cp(driverDir, newDriverDir, {
      recursive: true,
      force: true,
      preserveTimestamps: true,
      dereference: false,
      errorOnExist: false
    });
    const data = await execFileAsync$1(
      driverPath.replace(driverDir, newDriverDir),
      args
    );
    if (data.stderr) {
      throw new Error(data.stderr);
    }
    return data;
  }
};
const getDataFromAccessDatabase = async (sql2) => {
  const config = settings.store;
  const data = await execFileAsyncWithRetry(config.driverPath, [
    "GetDataFromAccessDatabase",
    config.databasePath,
    sql2
  ]);
  return JSON.parse(data.stdout);
};
const getDetectionByZH = async (params) => {
  const startDate = dayjs(params.startDate).format(DATE_FORMAT_DATABASE);
  const endDate = dayjs(params.endDate).format(DATE_FORMAT_DATABASE);
  const [detection] = await getDataFromAccessDatabase(
    `SELECT TOP 1 * FROM detections WHERE szIDsWheel ='${params.zh}' AND tmnow BETWEEN #${startDate}# AND #${endDate}# ORDER BY tmnow DESC`
  );
  if (!detection) {
    throw new Error(`未找到轴号[${params.zh}]的detections记录`);
  }
  return detection;
};
const getDetectionDatasByOPID = async (opid) => {
  const detectionDatas = await getDataFromAccessDatabase(
    `SELECT * FROM detections_data WHERE opid ='${opid}'`
  );
  return detectionDatas;
};
const getCorporation = async () => {
  const [corporation] = await getDataFromAccessDatabase(
    "SELECT TOP 1 * FROM corporation"
  );
  if (!corporation) {
    throw new Error("未找到公司信息");
  }
  return corporation;
};
const autoInputToVC = async (data) => {
  const driverPath = settings.get("driverPath");
  const cp2 = await execFileAsyncWithRetry(driverPath, [
    "autoInputToVC",
    data.zx,
    data.zh,
    data.czzzdw,
    data.sczzdw,
    data.mczzdw,
    dayjs(data.czzzrq).format("YYYYMM"),
    dayjs(data.sczzrq).format("YYYYMMDD"),
    dayjs(data.mczzrq).format("YYYYMMDD"),
    data.ztx,
    data.ytx
  ]);
  return cp2.stdout;
};
const initIpc$6 = () => {
  ipcMain.handle(
    getDataFromAccessDatabase$1,
    withLog(async (_, sql2) => {
      return await getDataFromAccessDatabase(sql2);
    })
  );
  ipcMain.handle(
    autoInputToVC$1,
    withLog(async (_, data) => {
      return await autoInputToVC(data);
    })
  );
};
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const stdoutMap = /* @__PURE__ */ new WeakMap();
const getCpuSerial = async () => {
  const cache = stdoutMap.get(getCpuSerial);
  if (cache) return cache;
  const data = await execAsync(
    "Get-CimInstance -ClassName Win32_Processor | Select-Object ProcessorId",
    { shell: "powershell" }
  );
  if (data.stderr) {
    throw new Error(data.stderr);
  }
  stdoutMap.set(getCpuSerial, data.stdout);
  return data.stdout;
};
const getSerialFromStdout = (stdout) => {
  return stdout.trim().split("\n").at(-1) || "";
};
const verifyActivation = async () => {
  const cpuSerial = await getCpuSerial();
  const serial = getSerialFromStdout(cpuSerial);
  const activateCode = settings.get("activateCode");
  const exceptedCode = createHash("md5").update([serial, DATE_FORMAT_DATABASE].join("")).digest("hex").toUpperCase();
  return Object.is(activateCode, exceptedCode);
};
const winword_paths = [
  "C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE"
];
const verifyPath = async (path) => {
  await access(path, constants.R_OK);
  return path;
};
const runWinword = async (data) => {
  const winwords = await Promise.allSettled(
    winword_paths.map((path) => verifyPath(path))
  );
  const winword = winwords.find(
    (result) => result.status === "fulfilled"
  )?.value;
  if (!winword) {
    throw new Error("Find winword failed");
  }
  const cp2 = await execFileAsync(
    winword,
    [
      data,
      "/save",
      "/q",
      "/pxslt",
      "/a",
      "/mFilePrint",
      "/mFileCloseOrExit",
      "/n",
      "/w",
      "/x"
    ],
    { windowsVerbatimArguments: false, shell: false }
  );
  return cp2;
};
const initIpc$5 = () => {
  ipcMain.handle(
    printer,
    withLog(async (e, data) => {
      void e;
      await runWinword(data).catch(() => shell.openPath(data));
    })
  );
  ipcMain.handle(
    verifyActivation$1,
    withLog(async () => {
      const cpuSerial = await getCpuSerial();
      const serial = getSerialFromStdout(cpuSerial);
      const isOk = await verifyActivation();
      return { isOk, serial };
    })
  );
};
const jtvBarcodeTable = sqliteTable("jtv_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" })
});
const hxzyBarcodeTable = sqliteTable("hxzy_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" })
});
const jtvXuzhoubeiBarcodeTable = sqliteTable("jtv_xuzhoubei_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
  PJ_ZZRQ: text("PJ_ZZRQ"),
  PJ_ZZDW: text("PJ_ZZDW"),
  PJ_SCZZRQ: text("PJ_SCZZRQ"),
  PJ_SCZZDW: text("PJ_SCZZDW"),
  PJ_MCZZRQ: text("PJ_MCZZRQ"),
  PJ_MCZZDW: text("PJ_MCZZDW")
});
const khBarcodeTable = sqliteTable("kh_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" })
});
const xlsxSizeTable = sqliteTable(
  "xlsxSize",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    type: text("type"),
    index: text("index"),
    size: numeric("size", { mode: "number" }),
    xlsxName: text("xlsxName")
  },
  (table) => [
    unique("xlsxName_position_unique").on(
      table.xlsxName,
      table.type,
      table.index
    )
  ]
);
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hxzyBarcodeTable,
  jtvBarcodeTable,
  jtvXuzhoubeiBarcodeTable,
  khBarcodeTable,
  xlsxSizeTable
}, Symbol.toStringTag, { value: "Module" }));
const __dirname$1 = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(app.getPath("userData"), "db.db");
const sqliteDb = new Database(dbPath);
const db = drizzle(sqliteDb, { schema });
migrate(db, { migrationsFolder: join(__dirname$1, "../../drizzle") });
const sqlite_get$3 = async (params) => {
  const [{ count }] = await db.select({ count: sql.count() }).from(hxzyBarcodeTable).where(
    sql.between(
      hxzyBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    )
  ).limit(1);
  const rows = await db.query.hxzyBarcodeTable.findMany({
    where: sql.between(
      hxzyBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize
  });
  return { rows, count };
};
const sqlite_delete$3 = async (id) => {
  const [result] = await db.delete(hxzyBarcodeTable).where(sql.eq(hxzyBarcodeTable.id, id)).returning();
  return result;
};
const fetch_get$3 = async (barcode) => {
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/getDate`
  );
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", barcode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  return data;
};
const fetch_set$3 = async (request) => {
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveData`
  );
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request);
  log(`请求数据:${url.href},${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== "200") {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};
const api_get$3 = async (barcode) => {
  const data = await fetch_get$3(barcode);
  await db.insert(hxzyBarcodeTable).values({
    barCode: barcode,
    zh: data.data[0].ZH,
    date: /* @__PURE__ */ new Date(),
    isUploaded: false
  });
  return data;
};
const recordToBody$3 = async (record) => {
  const id = record.id;
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }
  if (!record.barCode) {
    throw new Error(`记录#${id}条形码不存在`);
  }
  const corporation = await getCorporation();
  const EQ_IP = corporation.DeviceNO || "";
  const EQ_BH = getIP();
  const GD = hxzy_hmis.get("gd");
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate
  });
  const user = detection.szUsername || "";
  let detectionDatas = [];
  let TFLAW_PLACE = "";
  let TFLAW_TYPE = "";
  let TVIEW = "";
  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      TFLAW_PLACE = "车轴";
      TFLAW_TYPE = "裂纹";
      TVIEW = "人工复探";
      detectionDatas = await getDetectionDatasByOPID(detection.szIDs);
      break;
  }
  detectionDatas.forEach((detectionData) => {
    switch (detectionData.nChannel) {
      case 0:
        TFLAW_PLACE = "穿透";
        break;
      case 1:
      case 2:
        TFLAW_PLACE = "卸荷槽";
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        TFLAW_PLACE = "轮座";
        break;
    }
  });
  return {
    EQ_IP,
    EQ_BH,
    GD,
    dh: record.barCode,
    zx: detection.szWHModel || "",
    zh: record.zh,
    TSFF: "超声波",
    TSSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    TFLAW_PLACE,
    TFLAW_TYPE,
    TVIEW,
    CZCTZ: user,
    CZCTY: user,
    LZXRBZ: user,
    LZXRBY: user,
    XHCZ: user,
    XHCY: user,
    TSZ: user,
    TSZY: user,
    CT_RESULT: detection.szResult || ""
  };
};
const emit$3 = createEmit(hxzy_hmis_api_set);
const api_set$3 = async (id) => {
  const record = await db.query.hxzyBarcodeTable.findFirst({
    where: sql.eq(hxzyBarcodeTable.id, id)
  });
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }
  const postParams = await recordToBody$3(record);
  await fetch_set$3([postParams]);
  const [result] = await db.update(hxzyBarcodeTable).set({ isUploaded: true }).where(sql.eq(hxzyBarcodeTable.id, id)).returning();
  emit$3();
  return result;
};
const idToUploadVerifiesData = async (id) => {
  const [verifies] = await getDataFromAccessDatabase(
    `SELECT * FROM verifies WHERE szIDs ='${id}'`
  );
  if (!verifies) {
    throw new Error(`未找到ID[${id}]的verifies记录`);
  }
  const verifiesData = await getDataFromAccessDatabase(
    `SELECT * FROM verifies_data WHERE opid ='${verifies.szIDs}'`
  );
  return {
    verifies,
    verifiesData
  };
};
const doTask$3 = withLog(api_set$3);
let timer$3 = null;
const autoUploadHandler$3 = async () => {
  const delay = hxzy_hmis.get("autoUploadInterval") * 1e3;
  timer$3 = setTimeout(autoUploadHandler$3, delay);
  const activated = verifyActivation();
  if (!activated) return;
  const barcodes = await db.query.hxzyBarcodeTable.findMany({
    where: sql.and(
      sql.eq(hxzyBarcodeTable.isUploaded, false),
      sql.between(
        hxzyBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate()
      )
    )
  });
  for (const barcode of barcodes) {
    await doTask$3(barcode.id).catch(Boolean);
  }
};
const initAutoUpload$3 = () => {
  if (hxzy_hmis.get("autoUpload")) {
    autoUploadHandler$3();
  }
  hxzy_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler$3();
      return;
    }
    if (!timer$3) return;
    clearTimeout(timer$3);
  });
};
const initIpc$4 = () => {
  ipcMain.handle(
    hxzy_hmis_sqlite_get,
    withLog(
      async (e, params) => {
        void e;
        const data = await sqlite_get$3(params);
        return data;
      }
    )
  );
  ipcMain.handle(
    hxzy_hmis_sqlite_delete,
    withLog(async (e, id) => {
      void e;
      return await sqlite_delete$3(id);
    })
  );
  ipcMain.handle(
    hxzy_hmis_api_get,
    withLog(async (e, barcode) => {
      void e;
      return await api_get$3(barcode);
    })
  );
  ipcMain.handle(
    hxzy_hmis_api_set,
    withLog(async (e, id) => {
      void e;
      return await api_set$3(id);
    })
  );
  ipcMain.handle(
    hxzy_hmis_api_verifies,
    withLog(
      async (e, id) => {
        void e;
        return await idToUploadVerifiesData(id);
      }
    )
  );
  ipcMain.handle(
    hxzy_hmis_setting,
    withLog(async (e, data) => {
      void e;
      if (data) {
        hxzy_hmis.set(data);
      }
      return hxzy_hmis.store;
    })
  );
};
const init$3 = () => {
  initIpc$4();
  initAutoUpload$3();
};
const sqlite_get$2 = async (params) => {
  const [{ count }] = await db.select({ count: sql.count() }).from(jtvBarcodeTable).where(
    sql.between(
      jtvBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    )
  ).limit(1);
  const rows = await db.query.jtvBarcodeTable.findMany({
    where: sql.between(
      jtvBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize
  });
  return { rows, count };
};
const sqlite_delete$2 = async (id) => {
  const [result] = await db.delete(jtvBarcodeTable).where(sql.eq(jtvBarcodeTable.id, id)).returning();
  return result;
};
const fetch_get$2 = async (barcode) => {
  const host = jtv_hmis.get("host");
  const unitCode = jtv_hmis.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [barcode, unitCode].join(","));
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  return data;
};
const fetch_set$2 = async (request) => {
  const host = jtv_hmis.get("host");
  const url = new URL(`http://${host}/api/saveData`);
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request);
  log(`请求数据:${url.href},${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== "200") {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};
const api_get$2 = async (barcode) => {
  const data = await fetch_get$2(barcode);
  await db.insert(jtvBarcodeTable).values({
    barCode: barcode,
    zh: data.data[0].ZH,
    date: /* @__PURE__ */ new Date(),
    isUploaded: false
  });
  return data;
};
const recordToBody$2 = async (record) => {
  const id = record.id;
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }
  if (!record.barCode) {
    throw new Error(`记录#${id}条形码不存在`);
  }
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const eq_ip = getIP();
  const corporation = await getCorporation();
  const eq_bh = corporation.DeviceNO || "";
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate
  });
  const user = detection.szUsername || "";
  let detectionDatas = [];
  let TFLAW_PLACE = "";
  let TFLAW_TYPE = "";
  let TVIEW = "";
  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      TFLAW_PLACE = "车轴";
      TFLAW_TYPE = "裂纹";
      TVIEW = "人工复探";
      detectionDatas = await getDetectionDatasByOPID(detection.szIDs);
      break;
  }
  detectionDatas.forEach((detectionData) => {
    switch (detectionData.nChannel) {
      case 0:
        TFLAW_PLACE = "穿透";
        break;
      case 1:
      case 2:
        TFLAW_PLACE = "卸荷槽";
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        TFLAW_PLACE = "轮座";
        break;
    }
  });
  return {
    eq_ip,
    eq_bh,
    dh: record.barCode,
    zx: detection.szWHModel || "",
    zh: record.zh,
    TSFF: "超声波",
    TSSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    TFLAW_PLACE,
    TFLAW_TYPE,
    TVIEW,
    CZCTZ: user,
    CZCTY: user,
    LZXRBZ: user,
    LZXRBY: user,
    XHCZ: user,
    XHCY: user,
    TSZ: user,
    TSZY: user,
    CT_RESULT: detection.szResult || ""
  };
};
const emit$2 = createEmit(jtv_hmis_api_set);
const api_set$2 = async (id) => {
  const record = await db.query.jtvBarcodeTable.findFirst({
    where: sql.eq(jtvBarcodeTable.id, id)
  });
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  const body = await recordToBody$2(record);
  await fetch_set$2([body]);
  const [result] = await db.update(jtvBarcodeTable).set({ isUploaded: true }).where(sql.eq(jtvBarcodeTable.id, record.id)).returning();
  emit$2();
  return result;
};
const doTask$2 = withLog(api_set$2);
let timer$2 = null;
const autoUploadHandler$2 = async () => {
  const delay = jtv_hmis.get("autoUploadInterval") * 1e3;
  timer$2 = setTimeout(autoUploadHandler$2, delay);
  const activated = verifyActivation();
  if (!activated) return;
  const barcodes = await db.query.jtvBarcodeTable.findMany({
    where: sql.and(
      sql.eq(jtvBarcodeTable.isUploaded, false),
      sql.between(
        jtvBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate()
      )
    )
  });
  for (const barcode of barcodes) {
    await doTask$2(barcode.id).catch(Boolean);
  }
};
const initAutoUpload$2 = () => {
  if (jtv_hmis.get("autoUpload")) {
    autoUploadHandler$2();
  }
  jtv_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler$2();
      return;
    }
    if (!timer$2) return;
    clearTimeout(timer$2);
  });
};
const initIpc$3 = () => {
  ipcMain.handle(
    jtv_hmis_sqlite_get,
    withLog(
      async (e, params) => {
        void e;
        const data = await sqlite_get$2(params);
        return data;
      }
    )
  );
  ipcMain.handle(
    jtv_hmis_sqlite_delete,
    withLog(async (e, id) => {
      void e;
      return await sqlite_delete$2(id);
    })
  );
  ipcMain.handle(
    jtv_hmis_api_get,
    withLog(async (e, barcode) => {
      void e;
      return await api_get$2(barcode);
    })
  );
  ipcMain.handle(
    jtv_hmis_api_set,
    withLog(async (e, id) => {
      void e;
      const data = await api_set$2(id);
      return data;
    })
  );
  ipcMain.handle(
    jtv_hmis_setting,
    withLog(
      async (e, data) => {
        void e;
        if (data) {
          jtv_hmis.set(data);
        }
        return jtv_hmis.store;
      }
    )
  );
};
const init$2 = () => {
  initIpc$3();
  initAutoUpload$2();
};
const sqlite_get$1 = async (params) => {
  const [{ count }] = await db.select({ count: sql.count() }).from(jtvXuzhoubeiBarcodeTable).where(
    sql.between(
      jtvXuzhoubeiBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    )
  ).limit(1);
  const rows = await db.query.jtvXuzhoubeiBarcodeTable.findMany({
    where: sql.between(
      jtvXuzhoubeiBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize
  });
  return { rows, count };
};
const sqlite_delete$1 = async (id) => {
  const [result] = await db.delete(jtvXuzhoubeiBarcodeTable).where(sql.eq(jtvXuzhoubeiBarcodeTable.id, id)).returning();
  return result;
};
const fetch_get$1 = async (barCode) => {
  const host = jtv_hmis_xuzhoubei.get("host");
  const url = new URL(`http://${host}/pmss/vjkxx.do`);
  url.searchParams.set("method", "getData");
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", barCode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  return data;
};
const fetch_set$1 = async (request) => {
  const host = jtv_hmis_xuzhoubei.get("host");
  const url = new URL(`http://${host}/pmss/example.do`);
  url.searchParams.set("method", "saveData");
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request);
  log(`请求数据:${url.href},${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (!data) {
    throw `接口异常${data}`;
  }
  return data;
};
const formatDate = (date) => dayjs(date).format("YYYY-MM-DD HH:mm:ss");
const hasQX = (result) => {
  switch (result) {
    case "故障":
    case "有故障":
    case "疑似故障":
      return true;
    default:
      return false;
  }
};
const api_get$1 = async (barCode) => {
  const data = await fetch_get$1(barCode);
  await db.insert(jtvXuzhoubeiBarcodeTable).values({
    barCode,
    zh: data[0].ZH,
    date: /* @__PURE__ */ new Date(),
    isUploaded: false,
    PJ_ZZRQ: data[0].CZZZRQ,
    PJ_ZZDW: data[0].CZZZDW,
    PJ_SCZZRQ: data[0].SCZZRQ,
    PJ_SCZZDW: data[0].SCZZDW,
    PJ_MCZZRQ: data[0].MCZZRQ,
    PJ_MCZZDW: data[0].MCZZDW
  });
  return data;
};
const getPlace = (nChannel) => {
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "轴颈";
    case 3:
      return "外";
    case 4:
      return "内";
    case 5:
    case 6:
    case 7:
    case 8:
      return "轮座";
    default:
      return "车轴";
  }
};
const recordToBody$1 = async (record) => {
  if (!record.zh) {
    throw new Error(`记录轴号不存在`);
  }
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await getCorporation();
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate
  });
  const SB_SN = corporation.DeviceNO || "";
  const hmis = jtv_hmis_xuzhoubei.store;
  const usernameInDB = detection.szUsername || "";
  const user = [hmis.username_prefix, usernameInDB].join("");
  const body = {
    PJ_JXID: detection.szIDs,
    SB_SN,
    PJ_TAG: "0",
    // 设备工作状态(开始检修1/结束检修0检修前后更新此标志)
    PJ_ZH: record.zh,
    // 轴号
    PJ_XH: detection.szWHModel || "",
    // 轴型
    PJ_ZZRQ: record.PJ_ZZRQ || "",
    // 制造日期
    PJ_ZZDW: record.PJ_ZZDW || "",
    // 制造单位
    PJ_SN: record.barCode || "",
    // 从HMIS获取的唯一ID(记录流水号)
    PJ_JXRQ: formatDate(detection.tmnow),
    // 检修日期(最近更新PJ_TAG的时间)
    CZCTZ: user,
    // 车轴穿透左(人员签名)
    CZCTY: user,
    // 车轴穿透右(人员签名)
    LZXRBZ: user,
    // 轮座镶入部左(人员签名)
    LZXRBY: user,
    // 轮座镶入部右(人员签名)
    XHCZ: detection.bWheelLS ? user : null,
    // 卸荷槽左(人员签名)
    XHCY: detection.bWheelRS ? user : null,
    // 卸荷槽右(人员签名)
    LW_TFLAW_PLACE: null,
    // 缺陷部位
    LW_TFLAW_TYPE: null,
    // 缺陷类型
    LW_TVIEW: "良好",
    // 处理意见
    PJ_SCZZRQ: formatDate(record.PJ_SCZZRQ),
    // 首次组装日期
    PJ_SCZZDW: record.PJ_SCZZDW || "",
    // 首次组装单位
    PJ_MCZZRQ: formatDate(record.PJ_MCZZRQ),
    // 末次组装日期
    PJ_MCZZDW: record.PJ_MCZZDW || "",
    // 末次组装单位
    LW_CZCTZ: "正常",
    // 左穿透
    LW_CZCTY: "正常",
    // 右穿透
    LW_LZXRBZ: "正常",
    // 左轮座
    LW_LZXRBY: "正常",
    // 右轮座
    LW_XHCZ: "正常",
    // 左轴颈
    LW_XHCY: "正常"
    // 右轴颈
  };
  const hasQx = hasQX(detection.szResult);
  if (hasQx) {
    const detectionDatas = await getDetectionDatasByOPID(detection.szIDs);
    if (detectionDatas.length === 0) {
      body.LW_TFLAW_PLACE = "车轴";
    } else {
      body.LW_TFLAW_PLACE = detectionDatas.reduce((result, detectionData) => {
        const direction = getDirection(detectionData.nBoard);
        const place = getPlace(detectionData.nChannel);
        result.push(`${place}${direction}`);
        return result;
      }, []).join(",");
    }
    body.LW_TVIEW = "疑似裂纹";
    body.LW_TFLAW_TYPE = "横裂纹";
  }
  return body;
};
const emit$1 = createEmit(jtv_hmis_xuzhoubei_api_set);
const api_set$1 = async (id) => {
  const record = await db.query.jtvXuzhoubeiBarcodeTable.findFirst({
    where: sql.eq(jtvXuzhoubeiBarcodeTable.id, id)
  });
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }
  const body = await recordToBody$1(record);
  await fetch_set$1(body);
  const [result] = await db.update(jtvXuzhoubeiBarcodeTable).set({
    isUploaded: true
  }).where(sql.eq(jtvXuzhoubeiBarcodeTable.id, id)).returning();
  emit$1();
  return result;
};
const doTask$1 = withLog(api_set$1);
let timer$1 = null;
const autoUploadHandler$1 = async () => {
  const delay = jtv_hmis_xuzhoubei.get("autoUploadInterval") * 1e3;
  timer$1 = setTimeout(autoUploadHandler$1, delay);
  const activated = verifyActivation();
  if (!activated) return;
  const barcodes = await db.query.jtvXuzhoubeiBarcodeTable.findMany({
    where: sql.and(
      sql.eq(jtvXuzhoubeiBarcodeTable.isUploaded, false),
      sql.between(
        jtvXuzhoubeiBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate()
      )
    )
  });
  for (const barcode of barcodes) {
    await doTask$1(barcode.id).catch(Boolean);
  }
};
const initAutoUpload$1 = () => {
  if (jtv_hmis_xuzhoubei.get("autoUpload")) {
    autoUploadHandler$1();
  }
  jtv_hmis_xuzhoubei.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler$1();
      return;
    }
    if (!timer$1) return;
    clearTimeout(timer$1);
  });
};
const initIpc$2 = () => {
  ipcMain.handle(
    jtv_hmis_xuzhoubei_sqlite_get,
    withLog(
      async (e, params) => {
        void e;
        const data = await sqlite_get$1(params);
        return data;
      }
    )
  );
  ipcMain.handle(
    jtv_hmis_xuzhoubei_sqlite_delete,
    withLog(async (e, id) => {
      void e;
      return await sqlite_delete$1(id);
    })
  );
  ipcMain.handle(
    jtv_hmis_xuzhoubei_api_get,
    withLog(async (e, barcode) => {
      void e;
      return await api_get$1(barcode);
    })
  );
  ipcMain.handle(
    jtv_hmis_xuzhoubei_api_set,
    withLog(async (e, id) => {
      void e;
      return await api_set$1(id);
    })
  );
  ipcMain.handle(
    jtv_hmis_xuzhoubei_setting,
    withLog(
      async (e, data) => {
        void e;
        if (data) {
          jtv_hmis_xuzhoubei.set(data);
        }
        return jtv_hmis_xuzhoubei.store;
      }
    )
  );
};
const init$1 = () => {
  initIpc$2();
  initAutoUpload$1();
};
const sqlite_get = async (params) => {
  const [{ count }] = await db.select({ count: sql.count() }).from(khBarcodeTable).where(
    sql.between(
      khBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    )
  ).limit(1);
  const rows = await db.query.khBarcodeTable.findMany({
    where: sql.between(
      khBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate)
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize
  });
  return { rows, count };
};
const sqlite_delete = async (id) => {
  const [result] = await db.delete(khBarcodeTable).where(sql.eq(khBarcodeTable.id, id)).returning();
  return result;
};
const fetch_get = async (barCode) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_get/get`);
  const body = JSON.stringify({
    mesureId: barCode
  });
  log(`请求数据[${url.href}]:${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};
const fetch_set = async (params) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_tsjg/save`);
  const body = JSON.stringify(params);
  log(`请求数据[${url.href}]:${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};
const saveQXData = async (params) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
  const body = JSON.stringify(params);
  log(`请求数据[${url.href}]:${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};
const api_get = async (barCode) => {
  const data = await fetch_get(barCode);
  await db.insert(khBarcodeTable).values({
    barCode,
    zh: data.data.zh,
    date: /* @__PURE__ */ new Date(),
    isUploaded: false
  }).returning();
  return data;
};
const recordToBody = async (record) => {
  const id = record.id;
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }
  if (!record.barCode) {
    throw new Error(`记录#${id}条形码不存在`);
  }
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await getCorporation();
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate
  });
  const JCJG = detection.szResult === "合格" ? "1" : "0";
  const hmis = kh_hmis.store;
  const basicBody = {
    mesureId: record.barCode,
    ZH: record.zh,
    // 1 探伤 0 不探伤
    ZCTJG: "1",
    ZZJJG: "1",
    ZLZJG: "1",
    YCTJG: "1",
    YZJJG: "1",
    YLZJG: "1",
    JCJG,
    BZ: "",
    TSRY: detection.szUsername || "",
    JCSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    sbbh: corporation.DeviceNO || ""
  };
  return {
    basicBody,
    qxBody: {
      mesureid: record.barCode,
      zh: record.zh,
      testdatetime: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
      testtype: "超声波",
      btcw: "车轴",
      tsr: detection.szUsername || "",
      tsgz: hmis.tsgz,
      tszjy: hmis.tszjy,
      tsysy: hmis.tsysy,
      gzmc: "裂纹",
      clff: "人工复探",
      bz: ""
    },
    isQualified: JCJG === "1"
  };
};
const emit = createEmit(kh_hmis_api_set);
const api_set = async (id) => {
  const record = await db.query.khBarcodeTable.findFirst({
    where: sql.eq(khBarcodeTable.id, id)
  });
  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }
  const data = await recordToBody(record);
  await fetch_set(data.basicBody);
  if (!data.isQualified) {
    await saveQXData(data.qxBody);
  }
  const [result] = await db.update(khBarcodeTable).set({ isUploaded: true }).where(sql.eq(khBarcodeTable.id, id)).returning();
  emit();
  return result;
};
const doTask = withLog(api_set);
let timer = null;
const autoUploadHandler = async () => {
  const delay = kh_hmis.get("autoUploadInterval") * 1e3;
  timer = setTimeout(autoUploadHandler, delay);
  const activated = verifyActivation();
  if (!activated) return;
  const barcodes = await db.query.khBarcodeTable.findMany({
    where: sql.and(
      sql.eq(khBarcodeTable.isUploaded, false),
      sql.between(
        khBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate()
      )
    )
  });
  for (const barcode of barcodes) {
    await doTask(barcode.id).catch(Boolean);
  }
};
const initAutoUpload = () => {
  if (kh_hmis.get("autoUpload")) {
    autoUploadHandler();
  }
  kh_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler();
      return;
    }
    if (!timer) return;
    clearTimeout(timer);
  });
};
const initIpc$1 = () => {
  ipcMain.handle(
    kh_hmis_sqlite_get,
    withLog(
      async (e, params) => {
        void e;
        const data = await sqlite_get(params);
        return data;
      }
    )
  );
  ipcMain.handle(
    kh_hmis_sqlite_delete,
    withLog(async (e, id) => {
      void e;
      return await sqlite_delete(id);
    })
  );
  ipcMain.handle(
    kh_hmis_api_get,
    withLog(async (e, barcode) => {
      void e;
      return await api_get(barcode);
    })
  );
  ipcMain.handle(
    kh_hmis_api_set,
    withLog(async (e, id) => {
      void e;
      return await api_set(id);
    })
  );
  ipcMain.handle(
    kh_hmis_setting,
    withLog(
      async (e, data) => {
        void e;
        if (data) {
          kh_hmis.set(data);
        }
        return kh_hmis.store;
      }
    )
  );
};
const init = () => {
  initIpc$1();
  initAutoUpload();
};
const columnWidths$2 = /* @__PURE__ */ new Map([
  ["A", 8],
  ["B", 8],
  ["C", 4],
  ["D", 4],
  ["E", 4],
  ["F", 4],
  ["G", 4],
  ["H", 4],
  ["I", 4],
  ["J", 4],
  ["K", 4],
  ["L", 4],
  ["M", 4],
  ["N", 4],
  ["O", 4],
  ["P", 4],
  ["Q", 4],
  ["R", 4],
  ["S", 4],
  ["T", 4],
  ["U", 4],
  ["V", 4],
  ["W", 4],
  ["X", 4],
  ["Y", 4],
  ["Z", 4],
  ["AA", 8]
]);
const rowHeights$2 = /* @__PURE__ */ new Map([
  [1, 50],
  [2, 48],
  [3, 40],
  [4, 34],
  [5, 44],
  [6, 28],
  [7, 24],
  [8, 24],
  [9, 24],
  [10, 24],
  [11, 24],
  [12, 24],
  [13, 24],
  [14, 24],
  [15, 24],
  [16, 24],
  [17, 24],
  [18, 24],
  [19, 24],
  [20, 24],
  [21, 24],
  [22, 30],
  [23, 30],
  [24, 30],
  [25, 30],
  [26, 34],
  [27, 34],
  [28, 28]
]);
const border4$1 = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" }
};
const alignCenter$1 = {
  vertical: "middle",
  horizontal: "center",
  wrapText: false
};
const typography = {
  name: "宋体",
  size: 10,
  bold: false,
  underline: false
};
const chr_502 = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 16;
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.printArea = "A1:AA28";
  sheet.headerFooter.oddHeader = "&R辆货统-502";
  sheet.headerFooter.evenHeader = "&R辆货统-502";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";
  sheet.mergeCells("A1:AA1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "单位名称：";
  cellA1.value = "铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录";
  cellA1.font = { name: "宋体", size: 16, bold: true };
  cellA1.alignment = alignCenter$1;
  sheet.mergeCells("A2:B2");
  const cellA2 = sheet.getCell("A2");
  cellA2.value = "单位名称：";
  cellA2.font = { name: "宋体", size: 10, bold: false };
  cellA2.alignment = alignCenter$1;
  cellA2.border = border4$1;
  sheet.mergeCells("C2:N2");
  const cellC2 = sheet.getCell("C2");
  cellC2.value = "武汉江岸车辆段武南轮厂检修车间";
  cellC2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellC2.alignment = alignCenter$1;
  cellC2.border = border4$1;
  sheet.mergeCells("O2:R2");
  const cellO2 = sheet.getCell("O2:R2");
  cellO2.border = border4$1;
  sheet.mergeCells("S2:V2");
  const cellS2 = sheet.getCell("S2");
  cellS2.value = "检验时间：";
  cellS2.font = { name: "宋体", size: 10, bold: true };
  cellS2.alignment = alignCenter$1;
  cellS2.border = border4$1;
  sheet.mergeCells("W2:AA2");
  const cellW2 = sheet.getCell("W2:AA2");
  cellW2.value = (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  cellW2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellW2.alignment = alignCenter$1;
  cellW2.border = border4$1;
  const cellA3 = sheet.getCell("A3");
  cellA3.value = "设备编号";
  cellA3.font = typography;
  cellA3.alignment = alignCenter$1;
  cellA3.border = border4$1;
  const cellB3 = sheet.getCell("B3");
  cellB3.value = "";
  cellB3.font = typography;
  cellB3.alignment = alignCenter$1;
  cellB3.border = border4$1;
  sheet.mergeCells("C3:F3");
  const cellC3 = sheet.getCell("C3");
  cellC3.value = "制造时间";
  cellC3.font = typography;
  cellC3.alignment = alignCenter$1;
  cellC3.border = border4$1;
  sheet.mergeCells("G3:J3");
  const cellG3 = sheet.getCell("G3");
  cellG3.value = "";
  cellG3.font = typography;
  cellG3.alignment = alignCenter$1;
  cellG3.border = border4$1;
  sheet.mergeCells("K3:N3");
  const cellK3 = sheet.getCell("K3");
  cellK3.value = "制造单位";
  cellK3.font = typography;
  cellK3.alignment = alignCenter$1;
  cellK3.border = border4$1;
  sheet.mergeCells("O3:R3");
  const cellO3 = sheet.getCell("O3");
  cellO3.value = "";
  cellO3.font = typography;
  cellO3.alignment = alignCenter$1;
  cellO3.border = border4$1;
  sheet.mergeCells("S3:V3");
  const cellS3 = sheet.getCell("S3");
  cellS3.value = "上次检修时间";
  cellS3.font = typography;
  cellS3.alignment = alignCenter$1;
  cellS3.border = border4$1;
  sheet.mergeCells("W3:AA3");
  const cellW3 = sheet.getCell("W3:AA3");
  cellW3.value = (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  cellW3.font = typography;
  cellW3.alignment = alignCenter$1;
  cellW3.border = border4$1;
  sheet.mergeCells("A4:B6");
  const cellA4 = sheet.getCell("A4");
  cellA4.value = "通道";
  cellA4.font = typography;
  cellA4.alignment = alignCenter$1;
  cellA4.border = border4$1;
  sheet.mergeCells("C4:Z4");
  const cellC4 = sheet.getCell("C4");
  cellC4.value = "反射波高(dB)";
  cellC4.font = typography;
  cellC4.alignment = alignCenter$1;
  cellC4.border = border4$1;
  const cellAA4 = sheet.getCell("AA4");
  cellAA4.value = "";
  cellAA4.font = typography;
  cellAA4.alignment = alignCenter$1;
  cellAA4.border = border4$1;
  sheet.mergeCells("C5:F5");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "第一次";
  cellC5.font = typography;
  cellC5.alignment = alignCenter$1;
  cellC5.border = border4$1;
  sheet.mergeCells("G5:J5");
  const cellG5 = sheet.getCell("G5");
  cellG5.value = "第二次";
  cellG5.font = typography;
  cellG5.alignment = alignCenter$1;
  cellG5.border = border4$1;
  sheet.mergeCells("K5:N5");
  const cellK5 = sheet.getCell("K5");
  cellK5.value = "第三次";
  cellK5.font = typography;
  cellK5.alignment = alignCenter$1;
  cellK5.border = border4$1;
  sheet.mergeCells("O5:R5");
  const cellO5 = sheet.getCell("O5");
  cellO5.value = "第四次";
  cellO5.font = typography;
  cellO5.alignment = alignCenter$1;
  cellO5.border = border4$1;
  sheet.mergeCells("S5:V5");
  const cellS5 = sheet.getCell("S5");
  cellS5.value = "第五次";
  cellS5.font = typography;
  cellS5.alignment = alignCenter$1;
  cellS5.border = border4$1;
  sheet.mergeCells("W5:Z5");
  const cellW5 = sheet.getCell("W5");
  cellW5.value = "最大差值(dB)";
  cellW5.font = typography;
  cellW5.alignment = alignCenter$1;
  cellW5.border = border4$1;
  const cellAA5 = sheet.getCell("AA5");
  cellAA5.value = "结果评定";
  cellAA5.font = typography;
  cellAA5.alignment = alignCenter$1;
  cellAA5.border = border4$1;
  sheet.mergeCells("C6:D6");
  const cellC6 = sheet.getCell("C6");
  cellC6.value = "左";
  cellC6.font = typography;
  cellC6.alignment = alignCenter$1;
  cellC6.border = border4$1;
  sheet.mergeCells("E6:F6");
  const cellE6 = sheet.getCell("E6");
  cellE6.value = "右";
  cellE6.font = typography;
  cellE6.alignment = alignCenter$1;
  cellE6.border = border4$1;
  sheet.mergeCells("G6:H6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "左";
  cellG6.font = typography;
  cellG6.alignment = alignCenter$1;
  cellG6.border = border4$1;
  sheet.mergeCells("I6:J6");
  const cellI6 = sheet.getCell("I6");
  cellI6.value = "右";
  cellI6.font = typography;
  cellI6.alignment = alignCenter$1;
  cellI6.border = border4$1;
  sheet.mergeCells("K6:L6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "左";
  cellK6.font = typography;
  cellK6.alignment = alignCenter$1;
  cellK6.border = border4$1;
  sheet.mergeCells("M6:N6");
  const cellM6 = sheet.getCell("M6");
  cellM6.value = "右";
  cellM6.font = typography;
  cellM6.alignment = alignCenter$1;
  cellM6.border = border4$1;
  sheet.mergeCells("O6:P6");
  const cellO6 = sheet.getCell("O6");
  cellO6.value = "左";
  cellO6.font = typography;
  cellO6.alignment = alignCenter$1;
  cellO6.border = border4$1;
  sheet.mergeCells("Q6:R6");
  const cellQ6 = sheet.getCell("Q6");
  cellQ6.value = "右";
  cellQ6.font = typography;
  cellQ6.alignment = alignCenter$1;
  cellQ6.border = border4$1;
  sheet.mergeCells("S6:T6");
  const cellS6 = sheet.getCell("S6");
  cellS6.value = "左";
  cellS6.font = typography;
  cellS6.alignment = alignCenter$1;
  cellS6.border = border4$1;
  sheet.mergeCells("U6:V6");
  const cellU6 = sheet.getCell("U6");
  cellU6.value = "右";
  cellU6.font = typography;
  cellU6.alignment = alignCenter$1;
  cellU6.border = border4$1;
  sheet.mergeCells("W6:X6");
  const cellW6 = sheet.getCell("W6");
  cellW6.value = "左";
  cellW6.font = typography;
  cellW6.alignment = alignCenter$1;
  cellW6.border = border4$1;
  sheet.mergeCells("Y6:Z6");
  const cellY6 = sheet.getCell("Y6");
  cellY6.value = "右";
  cellY6.font = typography;
  cellY6.alignment = alignCenter$1;
  cellY6.border = border4$1;
  const cellAA6 = sheet.getCell("AA6");
  cellAA6.value = "";
  cellAA6.font = typography;
  cellAA6.alignment = alignCenter$1;
  cellAA6.border = border4$1;
  sheet.mergeCells("A7:A8");
  const cellA8 = sheet.getCell("A8");
  cellA8.value = "轴颈\n根部";
  cellA8.font = typography;
  cellA8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true
  };
  cellA8.border = border4$1;
  const cellB8 = sheet.getCell("B8");
  cellB8.value = "1";
  cellB8.font = typography;
  cellB8.alignment = alignCenter$1;
  cellB8.border = border4$1;
  sheet.mergeCells("A9:A20");
  const cellA10 = sheet.getCell("A10");
  cellA10.value = "轮\n座\n镶\n入\n部";
  cellA10.font = typography;
  cellA10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true
  };
  cellA10.border = border4$1;
  for (let i = 7; i < 22; i++) {
    const cellB = sheet.getCell(`B${i}`);
    cellB.font = typography;
    cellB.alignment = alignCenter$1;
    cellB.border = border4$1;
    switch (i) {
      case 7:
      case 9:
      case 21:
        cellB.value = "1";
        break;
      case 8:
      case 10:
        cellB.value = "2";
        break;
      default:
        cellB.value = "";
    }
    ["C", "E", "G", "I", "K", "M", "O", "Q", "S", "U", "W", "Y"].forEach(
      (col) => {
        const startCol = col;
        const endCol = String.fromCharCode(col.charCodeAt(0) + 1);
        sheet.mergeCells(`${startCol}${i}:${endCol}${i}`);
        const cell = sheet.getCell(`${startCol}${i}`);
        cell.font = typography;
        cell.alignment = alignCenter$1;
        cell.border = border4$1;
        cell.value = "";
      }
    );
    const cellAA = sheet.getCell(`AA${i}`);
    cellAA.value = "";
    cellAA.font = typography;
    cellAA.alignment = alignCenter$1;
    cellAA.border = border4$1;
  }
  const cellA21 = sheet.getCell("A21");
  cellA21.value = "全轴穿透";
  cellA21.font = typography;
  cellA21.alignment = alignCenter$1;
  cellA21.border = border4$1;
  sheet.mergeCells("A22:A25");
  const cellA22 = sheet.getCell("A22");
  cellA22.value = "参加\n人员\n签章";
  cellA22.font = typography;
  cellA22.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true
  };
  cellA22.border = border4$1;
  sheet.mergeCells("B22:D23");
  const cellB22 = sheet.getCell("B22");
  cellB22.value = "探伤工";
  cellB22.font = typography;
  cellB22.alignment = alignCenter$1;
  cellB22.border = border4$1;
  sheet.mergeCells("E22:H23");
  const cellE22 = sheet.getCell("E22");
  cellE22.value = "";
  cellE22.font = typography;
  cellE22.alignment = alignCenter$1;
  cellE22.border = border4$1;
  sheet.mergeCells("I22:K23");
  const cellI22 = sheet.getCell("I22");
  cellI22.value = "探伤工长";
  cellI22.font = typography;
  cellI22.alignment = alignCenter$1;
  cellI22.border = border4$1;
  sheet.mergeCells("L22:O23");
  const cellL22 = sheet.getCell("L22");
  cellL22.value = "";
  cellL22.font = typography;
  cellL22.alignment = alignCenter$1;
  cellL22.border = border4$1;
  sheet.mergeCells("P22:R23");
  const cellP22 = sheet.getCell("P22");
  cellP22.value = "质检员";
  cellP22.font = typography;
  cellP22.alignment = alignCenter$1;
  cellP22.border = border4$1;
  sheet.mergeCells("S22:V23");
  const cellS22 = sheet.getCell("S22");
  cellS22.value = "";
  cellS22.font = typography;
  cellS22.alignment = alignCenter$1;
  cellS22.border = border4$1;
  sheet.mergeCells("W22:Y23");
  const cellW22 = sheet.getCell("W22");
  cellW22.value = "验收员";
  cellW22.font = typography;
  cellW22.alignment = alignCenter$1;
  cellW22.border = border4$1;
  sheet.mergeCells("Z22:AA23");
  const cellZ22 = sheet.getCell("Z22");
  cellZ22.value = "";
  cellZ22.font = typography;
  cellZ22.alignment = alignCenter$1;
  cellZ22.border = border4$1;
  sheet.mergeCells("B24:D25");
  const cellB24 = sheet.getCell("B24");
  cellB24.value = "设备维修工";
  cellB24.font = typography;
  cellB24.alignment = alignCenter$1;
  cellB24.border = border4$1;
  sheet.mergeCells("E24:H25");
  const cellE24 = sheet.getCell("E24");
  cellE24.value = "";
  cellE24.font = typography;
  cellE24.alignment = alignCenter$1;
  cellE24.border = border4$1;
  sheet.mergeCells("I24:K25");
  const cellI24 = sheet.getCell("I24");
  cellI24.value = "轮轴专职";
  cellI24.font = typography;
  cellI24.alignment = alignCenter$1;
  cellI24.border = border4$1;
  sheet.mergeCells("L24:O25");
  const cellL24 = sheet.getCell("L24");
  cellL24.value = "";
  cellL24.font = typography;
  cellL24.alignment = alignCenter$1;
  cellL24.border = border4$1;
  sheet.mergeCells("P24:R25");
  const cellP24 = sheet.getCell("P24");
  cellP24.value = "设备专职";
  cellP24.font = typography;
  cellP24.alignment = alignCenter$1;
  cellP24.border = border4$1;
  sheet.mergeCells("S24:V25");
  const cellS24 = sheet.getCell("S24");
  cellS24.value = "";
  cellS24.font = typography;
  cellS24.alignment = alignCenter$1;
  cellS24.border = border4$1;
  sheet.mergeCells("W24:Y25");
  const cellW24 = sheet.getCell("W24");
  cellW24.value = "主管领导";
  cellW24.font = typography;
  cellW24.alignment = alignCenter$1;
  cellW24.border = border4$1;
  sheet.mergeCells("Z24:AA25");
  const cellZ24 = sheet.getCell("Z24");
  cellZ24.value = "";
  cellZ24.font = typography;
  cellZ24.alignment = alignCenter$1;
  cellZ24.border = border4$1;
  sheet.mergeCells("A26:D26");
  const cellA26 = sheet.getCell("A26");
  cellA26.value = "备注";
  cellA26.font = { name: "宋体", size: 12, bold: false };
  cellA26.alignment = alignCenter$1;
  cellA26.border = border4$1;
  sheet.mergeCells("E26:AA26");
  const cellE26 = sheet.getCell("E26");
  cellE26.value = "";
  cellE26.font = { name: "宋体", size: 12, bold: false };
  cellE26.alignment = alignCenter$1;
  cellE26.border = border4$1;
  sheet.mergeCells("A27:AA27");
  const cellA27 = sheet.getCell("A27");
  cellA27.value = "注：最大差值(ΔdB)是指五次波幅测量值中最大值与最小值之差，要求ΔdB≤6dB。";
  cellA27.font = { name: "宋体", size: 12, bold: false };
  cellA27.alignment = alignCenter$1;
  rowHeights$2.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });
  columnWidths$2.forEach((width, columnId) => {
    sheet.getColumn(columnId).width = width;
  });
  const rowHeightList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr502"),
      sql.eq(xlsxSizeTable.type, "row")
    )
  );
  const columnWidthList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr502"),
      sql.eq(xlsxSizeTable.type, "column")
    )
  );
  rowHeightList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getRow(Number.parseInt(index)).height = size;
  });
  columnWidthList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getColumn(index).width = size;
  });
  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
const columnWidths$1 = /* @__PURE__ */ new Map([
  ["A", 4],
  ["B", 8],
  ["C", 8],
  ["D", 8],
  ["E", 8],
  ["F", 8],
  ["G", 4],
  ["H", 4],
  ["I", 4],
  ["J", 4],
  ["K", 4],
  ["L", 4],
  ["M", 8],
  ["N", 10]
]);
const rowHeights$1 = /* @__PURE__ */ new Map([
  [1, 24],
  [2, 12],
  [3, 18],
  [4, 12],
  [5, 18],
  [6, 18],
  [7, 18],
  [8, 16],
  [9, 16],
  [10, 16],
  [11, 16],
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 16],
  [17, 16],
  [18, 16],
  [19, 16],
  [20, 16],
  [21, 16],
  [22, 16],
  [23, 16],
  [24, 16],
  [25, 16],
  [26, 16],
  [27, 16],
  [28, 16],
  [29, 16],
  [30, 16],
  [31, 16],
  [32, 16],
  [33, 16],
  [34, 16],
  [35, 16],
  [36, 16],
  [37, 16],
  [38, 16],
  [39, 16],
  [40, 16],
  [41, 16],
  [42, 16],
  [43, 16],
  [44, 16],
  [45, 16],
  [46, 16]
]);
const border4 = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" }
};
const alignCenter = {
  vertical: "middle",
  horizontal: "center",
  wrapText: false
};
const inspectionItems = [
  "注：探测部位中,①②和③分别代表如下内容",
  "磁粉探伤时：①代表轴身；②代表轮座或幅板孔；③代表轴颈及防尘板座。探测时应在被探",
  "测部位栏中画“√”，全轴都探时，①②和③则都画“√”",
  "超声波探伤时，①代表全轴穿透；②代表轮座镶入部；③代表轴颈根部（或卸荷槽）部位。",
  "探测时应在被探测部位栏中画“√”",
  "探伤方法，记录磁探、超探、微控超探",
  "探伤性质，记录初探和复探，初探和复探分别填写车统-53A",
  "微控超探发现缺陷时备注栏内注明“待复验”",
  "车统-53A装订成册，进行日小记和月累计统计"
];
const cols = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N"
];
const cols6 = ["G", "H", "I", "J", "K", "L"];
const chr_53a = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 16;
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.printArea = "A1:AA27";
  sheet.headerFooter.oddHeader = "&R车统-53A";
  sheet.headerFooter.evenHeader = "&R车统-53A";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";
  sheet.mergeCells("A1:N1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "铁路货车轮轴（轮对、车轴、车轮）超声波（磁粉）探伤记录";
  cellA1.font = { name: "宋体", size: 14, bold: true };
  cellA1.alignment = alignCenter;
  sheet.mergeCells("A3:D3");
  const cellA3 = sheet.getCell("A3");
  cellA3.value = "单位名称: ";
  cellA3.font = { name: "宋体", size: 12 };
  sheet.mergeCells("E3:F3");
  const cellE3 = sheet.getCell("E3");
  cellE3.value = "探伤方法: 微控超探";
  cellE3.font = { underline: true, name: "宋体", size: 12 };
  sheet.mergeCells("G3:I3");
  const cellG3 = sheet.getCell("G3");
  cellG3.value = "探伤性质: 初探";
  cellG3.font = { name: "宋体", size: 12 };
  sheet.mergeCells("J3:L3");
  const cellJ3 = sheet.getCell("J3");
  cellJ3.value = "探伤者: ";
  cellJ3.font = { name: "宋体", size: 12 };
  const cellN3 = sheet.getCell("N3");
  cellN3.value = (/* @__PURE__ */ new Date()).toLocaleDateString();
  sheet.mergeCells("A5:A7");
  const cellA5 = sheet.getCell("A5");
  cellA5.value = "序\n号";
  cellA5.font = { name: "宋体", size: 12 };
  cellA5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true
  };
  cellA5.border = border4;
  sheet.mergeCells("B5:B7");
  const cellB5 = sheet.getCell("B5");
  cellB5.value = "轴型";
  cellB5.font = { name: "宋体", size: 12 };
  cellB5.alignment = alignCenter;
  cellB5.border = border4;
  sheet.mergeCells("C5:C7");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "轴号";
  cellC5.font = { name: "宋体", size: 12 };
  cellC5.alignment = alignCenter;
  cellC5.border = border4;
  sheet.mergeCells("D5:D7");
  const cellD5 = sheet.getCell("D5");
  cellD5.value = "轮型";
  cellD5.font = { name: "宋体", size: 12 };
  cellD5.alignment = alignCenter;
  cellD5.border = border4;
  sheet.mergeCells("E5:F6");
  const cellE5 = sheet.getCell("E5");
  cellE5.value = "轮对首次组装";
  cellE5.alignment = alignCenter;
  cellE5.font = { name: "宋体", size: 12 };
  cellE5.border = border4;
  sheet.mergeCells("G5:L5");
  const cellG5 = sheet.getCell("G5");
  cellG5.value = "探测部位";
  cellG5.alignment = alignCenter;
  cellG5.font = { name: "宋体", size: 12 };
  cellG5.border = border4;
  sheet.mergeCells("M5:M7");
  const cellM5 = sheet.getCell("M5");
  cellM5.value = "探测\n部位";
  cellM5.alignment = { ...alignCenter, wrapText: true };
  cellM5.font = { name: "宋体", size: 12 };
  cellM5.border = border4;
  sheet.mergeCells("N5:N7");
  const cellN5 = sheet.getCell("N5");
  cellN5.value = "备注";
  cellN5.alignment = alignCenter;
  cellN5.font = { name: "宋体", size: 12 };
  cellN5.border = border4;
  sheet.mergeCells("G6:H6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "①";
  cellG6.alignment = alignCenter;
  cellG6.font = { name: "宋体", size: 12 };
  cellG6.border = border4;
  sheet.mergeCells("I6:J6");
  const cellI6 = sheet.getCell("I6");
  cellI6.value = "②";
  cellI6.alignment = alignCenter;
  cellI6.font = { name: "宋体", size: 12 };
  cellI6.border = border4;
  sheet.mergeCells("K6:L6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "③";
  cellK6.alignment = alignCenter;
  cellK6.font = { name: "宋体", size: 12 };
  cellK6.border = border4;
  const cellE7 = sheet.getCell("E7");
  cellE7.value = "时间";
  cellE7.alignment = alignCenter;
  cellE7.font = { name: "宋体", size: 12 };
  cellE7.border = border4;
  const cellF7 = sheet.getCell("F7");
  cellF7.value = "单位";
  cellF7.alignment = alignCenter;
  cellF7.font = { name: "宋体", size: 12 };
  cellF7.border = border4;
  cols6.forEach((col, idx) => {
    const cell = sheet.getCell(`${col}7`);
    cell.value = idx % 2 === 0 ? "左" : "右";
    cell.alignment = alignCenter;
    cell.font = { name: "宋体", size: 12 };
    cell.border = border4;
  });
  for (let i = 8; i < 38; i++) {
    cols.forEach((col) => {
      const cell = sheet.getCell(`${col + i}`);
      cell.border = border4;
    });
  }
  for (let i = 38; i < 47; i++) {
    const idx = i - 37;
    const cell = sheet.getCell(`A${i}`);
    cell.alignment = alignCenter;
    switch (i) {
      case 38:
      case 39:
        cell.value = `${idx}.`;
        break;
      case 40:
        break;
      case 41:
        cell.value = `${idx - 1}.`;
        break;
      case 42:
        break;
      default:
        cell.value = `${idx - 2}.`;
    }
    sheet.mergeCells(`B${i}:N${i}`);
    const cell2 = sheet.getCell(`B${i}`);
    cell2.value = inspectionItems[idx - 1];
    cell2.font = { name: "宋体", size: 10 };
    cell2.alignment = { vertical: "middle", horizontal: "left" };
  }
  columnWidths$1.forEach((width, col) => {
    sheet.getColumn(col).width = width;
  });
  rowHeights$1.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });
  const rowHeightList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr53a"),
      sql.eq(xlsxSizeTable.type, "row")
    )
  );
  const columnWidthList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr53a"),
      sql.eq(xlsxSizeTable.type, "column")
    )
  );
  rowHeightList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getRow(Number.parseInt(index)).height = size;
  });
  columnWidthList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getColumn(index).width = size;
  });
  const outputPath = join(app.getPath("temp"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
const columnWidths = /* @__PURE__ */ new Map([
  ["A", 4.1],
  ["B", 8],
  ["C", 6.9],
  ["D", 2.4],
  ["E", 10],
  ["F", 10],
  ["G", 10],
  ["H", 10],
  ["I", 10],
  ["J", 10],
  ["K", 10],
  ["L", 10],
  ["M", 10],
  ["N", 3.9],
  ["O", 10],
  ["P", 10],
  ["Q", 10],
  ["R", 6.9],
  ["S", 2.4],
  ["T", 10],
  ["U", 10],
  ["V", 10],
  ["W", 10],
  ["X", 10],
  ["Y", 10],
  ["Z", 10],
  ["AA", 10],
  ["AB", 10],
  ["AC", 10],
  ["AD", 10],
  ["AE", 10]
]);
const rowHeights = /* @__PURE__ */ new Map([
  [1, 24],
  [2, 8],
  [3, 18],
  [4, 8],
  [5, 18],
  [6, 18],
  [7, 18],
  [8, 16],
  [9, 16],
  [10, 16],
  [11, 16],
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 16],
  [17, 16],
  [18, 16],
  [19, 16],
  [20, 16],
  [21, 16],
  [22, 16],
  [23, 16],
  [24, 16],
  [25, 16],
  [26, 16],
  [27, 16],
  [28, 16],
  [29, 16],
  [30, 16],
  [31, 16],
  [32, 16],
  [33, 16],
  [34, 16],
  [35, 16],
  [36, 16],
  [37, 16],
  [38, 16],
  [39, 16],
  [40, 16],
  [41, 16],
  [42, 16],
  [43, 16],
  [44, 16],
  [45, 16],
  [46, 16]
]);
const chr_501 = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 16;
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.printArea = "A1:N47";
  sheet.headerFooter.oddHeader = "&R车统-501";
  sheet.headerFooter.evenHeader = "&R车统-501";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";
  columnWidths.forEach((width, col) => {
    sheet.getColumn(col).width = width;
  });
  rowHeights.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });
  const rowHeightList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr53a"),
      sql.eq(xlsxSizeTable.type, "row")
    )
  );
  const columnWidthList = await db.select({
    index: xlsxSizeTable.index,
    size: xlsxSizeTable.size
  }).from(xlsxSizeTable).where(
    sql.and(
      sql.eq(xlsxSizeTable.xlsxName, "chr53a"),
      sql.eq(xlsxSizeTable.type, "column")
    )
  );
  rowHeightList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getRow(Number.parseInt(index)).height = size;
  });
  columnWidthList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getColumn(index).width = size;
  });
  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
const initIpc = () => {
  ipcMain.handle(xlsx_chr_501, withLog(chr_501));
  ipcMain.handle(xlsx_chr_502, withLog(chr_502));
  ipcMain.handle(xlsx_chr_53a, withLog(chr_53a));
  ipcMain.handle(
    sqlite_xlsx_size_c,
    withLog(async (_, params) => {
      const data = await db.insert(xlsxSizeTable).values(params).returning();
      return data;
    })
  );
  ipcMain.handle(
    sqlite_xlsx_size_u,
    withLog(
      async (_, { id, xlsxName, type, index, size }) => {
        const data = await db.update(xlsxSizeTable).set({ xlsxName, type, index, size }).where(sql.eq(xlsxSizeTable.id, id)).returning();
        return data;
      }
    )
  );
  ipcMain.handle(
    sqlite_xlsx_size_r,
    withLog(
      async (_, {
        id,
        xlsxName,
        type,
        pageIndex = 0,
        pageSize = 10
      } = {}) => {
        const wheres = [
          id && sql.eq(xlsxSizeTable.id, id),
          xlsxName && sql.like(xlsxSizeTable.xlsxName, `%${xlsxName}%`),
          type && sql.like(xlsxSizeTable.type, `%${type}%`)
        ].filter((i) => typeof i === "object");
        const whereSearcher = sql.and(...wheres);
        const rows = await db.query.xlsxSizeTable.findMany({
          where: whereSearcher,
          offset: pageIndex * pageSize,
          limit: pageSize
        });
        const [{ count }] = await db.select({ count: sql.count() }).from(xlsxSizeTable).where(whereSearcher).limit(1);
        return { count, rows };
      }
    )
  );
  ipcMain.handle(
    sqlite_xlsx_size_d,
    withLog(async (_, { id }) => {
      const data = await db.delete(xlsxSizeTable).where(sql.eq(xlsxSizeTable.id, id)).returning();
      return data;
    })
  );
};
const createWindow = () => {
  const alwaysOnTop = settings.get("alwaysOnTop");
  console.log(__dirname);
  const win = new BrowserWindow$1({
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      sandbox: false
    },
    autoHideMenuBar: false,
    alwaysOnTop,
    width: 1024,
    height: 768,
    minWidth: 500
    // show: false,
  });
  Menu.setApplicationMenu(null);
  win.menuBarVisible = false;
  win.webContents.on("did-finish-load", () => {
  });
  win.on("focus", () => {
    win?.webContents.send(windowFocus);
  });
  win.on("blur", () => {
    win?.webContents.send(windowBlur);
  });
  win.on("show", () => {
    win?.webContents.send(windowShow);
  });
  win.on("hide", () => {
    win?.webContents.send(windowHide);
  });
  win.once("ready-to-show", () => {
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
};
app$1.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app$1.quit();
  }
});
app$1.on("activate", () => {
  if (BrowserWindow$1.getAllWindows().length === 0) {
    createWindow();
  }
});
const gotTheLock = app$1.requestSingleInstanceLock();
if (!gotTheLock) {
  app$1.quit();
} else {
  app$1.on("second-instance", () => {
    const win = BrowserWindow$1.getAllWindows().at(0);
    if (!win) return;
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  });
  electronApp.setAppUserModelId("com.electron");
  app$1.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  app$1.whenReady().then(async () => {
    const mode = settings.get("mode");
    nativeTheme$1.themeSource = mode;
    init$3();
    init$1();
    init$2();
    init();
    initIpc$6();
    init$4();
    initIpc$5();
    initIpc();
    createWindow();
  });
}
ipcMain$1.handle(
  getVersion,
  withLog(async () => app$1.getVersion())
);
ipcMain$1.handle(
  openAtLogin,
  withLog(async (e, openAtLogin2) => {
    void e;
    if (typeof openAtLogin2 === "boolean") {
      app$1.setLoginItemSettings({ openAtLogin: openAtLogin2 });
    }
    return app$1.getLoginItemSettings().launchItems.some((i) => i.enabled);
  })
);
ipcMain$1.handle(
  openDevTools,
  withLog(async () => {
    const win = BrowserWindow$1.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  })
);
ipcMain$1.handle(
  openPath,
  withLog(async (e, path) => {
    void e;
    const data = await shell.openPath(path);
    return data;
  })
);
ipcMain$1.handle(
  mem,
  withLog(async () => {
    const processMemoryInfo = await process.getProcessMemoryInfo();
    const freemem = processMemoryInfo.residentSet;
    return {
      totalmem: process.getSystemMemoryInfo().total,
      freemem
    };
  })
);
ipcMain$1.handle(
  mobileMode,
  withLog(async (e, mobile) => {
    void e;
    BrowserWindow$1.getAllWindows().forEach((win) => {
      if (mobile) {
        win.setSize(500, 800);
      } else {
        win.setSize(1024, 768);
      }
      win.center();
    });
    return mobile;
  })
);
