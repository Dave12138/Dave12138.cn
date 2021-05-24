function SetFile(box) {
    if (box.files[0] != null) {
        let filename = box.files[0].name;
        let end = filename.substr(filename.lastIndexOf('.'));
        let reader = new FileReader();
        reader.readAsDataURL(box.files[0]);
        reader.onload = function () {
            let type = this.result.substring(0, this.result.indexOf("base64") - 1).split("/")[1];
            let data = this.result.substring(this.result.indexOf("base64") + 7, this.result.length);
            document.getElementById("upload-state").innerHTML = "开始上传<br />";
            let partLength = 1048576;
            let part_count = Math.floor(data.length / partLength);
            if (data.length % partLength > 0) part_count++;
            let card = new Array();
            for (let i = 0; i < part_count; i++) {
                sendPart(box.files[0].name, type, data.substr(i * partLength, partLength), i, part_count, card);
            }
        }
    }
}

function sendPart(name, ty, da, part, partCount, card) {
    $.ajax({
        url: "/upload/",
        type: 'post',
        data: {
            "file": name,
            "type": ty,
            "data": da,
            "part": part,
            "part_count": partCount
        },
        dataType: 'json',
        complete: function (result) {
            console.info(result);

            //document.getElementById("upload-state").innerHTML = result.responseText;
            document.getElementById("upload-state").innerHTML += "\n" + result.responseText;
            card.push(part);
            if (card.length === partCount) {
                document.getElementById("upload-state").innerHTML += "文件上传完成<br />";
            }
        },
        fail: function () {
            document.getElementById("upload-state").innerHTML += "\n" + name + ".part" + part + "失败";
            sendPart(name, ty, da, part, partCount);
        }
    });
}
