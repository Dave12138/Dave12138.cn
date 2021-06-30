function updateCalendar() {
    let year = parseInt(document.getElementById("u4_input").value);
    let mon = parseInt(document.getElementById("u0_input").value) - 1;
    let c = new Date();
    if (year < 1) {
        year = 1;
        document.getElementById("u4_input").value = year;
    }
    c.setFullYear(year, mon, 1);
    //alert(c.toLocaleDateString());
    let g = document.getElementById("u3_div");
    let str = "";
    while (c.getDay() !== 1) {
        c.setDate(c.getDate() - 1);
    }
    let preMon = c.getMonth();
    //alert(c.toLocaleDateString());
    let flag0 = true;
    let flag1 = true;
    while (flag0 || flag1 || c.getDay() !== 1) {
        let cube;
        if (c.getMonth() === mon) cube = "cube";
        else cube = "gray-cube";
        let tmp = `<td style='text-align: center'><button class='${cube}' onclick='document.getElementById("ans-box").innerText = yesterday("${c.toLocaleDateString()}")' >${c.getDate()}</button></td>`;
        if (c.getDay() === 1) tmp = "<tr style='text-align: center'>" + tmp;
        if (c.getDay() === 0) tmp = tmp + "</tr>";

        c.setDate(c.getDate() + 1);
        if (c.getMonth() !== preMon) flag0 = false;
        if (!flag0 && c.getMonth() !== mon) flag1 = false;
        str += tmp;
    }
    g.innerHTML = "<table style='text-align: center;height: 100%;width: 100%;'><thead><tr><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th><th>日</th></tr></thead><tbody>" + str + "</tbody></table>"
}

function yesterday(date) {
    if (!/^(\d+)\/(\d{1,2})\/(\d{1,2})$/.test(date)) {
        let txt = "输入不符合规范";
        document.getElementById("ans-box").innerText = txt;
        return txt;
    }
    if (date === "1/1/1") return date + "是格里历公元元年第一天";
    let y = RegExp.$1 | 0;
    let m = RegExp.$2 - 1;
    let d = RegExp.$3 | 0;

    const dom = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (isLeap(y)) dom[1]++;
    if (y > 0 && m >= 0 && d > 0 && dom[m | 0] >= d) {
        d--;
        if (d < 1) {
            m--;
            if (m < 0) {
                m = 11;
                y--;
            }
            d = dom[m];
        }
        return `${date}前一天为${y}/${m + 1}/${d}`;
    } else {
        return `${date}不存在`;
    }
}

function dateExist(y, m, d) {
    const dom = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (y > 0 && m >= 0 && d > 0) {
        if (isLeap(y)) dom[1]++;
        if (dom[m | 0] >= d) return true;
    }
    return false;

}

function isLeap(year) {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}


function checkPhone() {
    let hi2rtn = document.getElementById("hi2Info");
    let e = document.getElementById('phone_input');
    let res = isPhoneNumberLegal(e.value);
    hi2rtn.innerText = "";
    if (res === true) {
        e.className = 'phone_legal';
    } else {
        e.className = 'phone_illegal';
        hi2rtn.innerText = res;
    }
}

function isPhoneNumberLegal(str) {

    if (!(str.length === 7 || str.length === 10)) {
        return "长度不正确";
    }
    if (!isDigit(str)) {
        return "并非纯数字组成";
    }
    if (/[01]\d{6}$/.test(str)) {
        return "前缀码以0或1开头";
    }
    return true;
}


function isDigit(value) {
    const patten = /^[0-9]*$/;
    return !(patten.exec(value) == null || value == "");
}

function rmbToCh(s) {
    let l = s + "";
    l = l.trim();
    if (!/^￥?\d{1,12}(\.\d{1,2})?$/.test(l)) {
        return "Error:输入不符合格式";
    }
    if (/\./.test(l)) {
        l = l.replace(/\./g, "元");
    } else {
        l = l + "元";
    }
    l = l.replace(/(\d)(\d{4}元)/, "$1万$2");
    l = l.replace(/(\d)(\d{4}万)/, "$1亿$2");
    l = l.replace(/(\d)(\d[万亿元])/g, "$1拾$2");
    l = l.replace(/(\d)(\d[拾])/g, "$1佰$2");
    l = l.replace(/(\d)(\d[佰])/g, "$1仟$2");
    l = l.replace(/(元\d)/, "$1角");
    l = l.replace(/(角\d)/, "$1分");
    l = l.replace(/0[拾佰仟角分]/g, "0");
    l = l.replace(/0+/g, "0");
    l = l.replace(/0$/g, "");
    l = l.replace(/0([万元])/g, "$1");
    l = l.replace(/([\d])/g, function(s) {
        let f = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        return f[s | 0];
    });
    l = l.replace(/^(.?)壹拾/, "$1拾");
    l = l.replace(/元$/, "元整");
    l = l.replace(/^(￥?)元/, "$1零元");
    l = l.replace(/^￥/, "人民币");

    return l;
}

//初始化
(function() {
    //程序1 UI初始化
    updateCalendar();
    let u4_input = document.getElementById("u4_input");
    u4_input.onchange = updateCalendar;
    //程序2 初始化 按钮绑定
    let phone_input = document.getElementById("phone_input");
    phone_input.onchange = checkPhone;
    phone_input.onkeydown = function(e) {
        if (e.code === "Enter") {
            checkPhone();
        }
    };
    phone_input.onclick = function() {
        phone_input.className = '';
    };

    //程序3 初始化 按钮绑定
    let rmbInput = document.getElementById("rmbInput");
    rmbInput.onkeydown = function(e) {
        if (e.code === "Enter") {
            document.getElementById('rmbOutput').value = rmbToCh(rmbInput.value);
        }
    };
    rmbInput.onchange = function() {
        document.getElementById('rmbOutput').value = rmbToCh(rmbInput.value);
    };

})();