(function () {
    let buttonL = document.getElementById("pre-page");
    let buttonR = document.getElementById("next-page");
    let pageField = document.getElementById("page_number");
    if (pageField != null) {
        pageField.onchange = function () {
            window.location.search = 'page=' + this.value
        };
        let r1 = `page=${pageField.value - 1}`;
        let r2 = `page=${(0 | pageField.value) + 1}`;
        if (buttonL != null) {
            buttonL.onclick = function () {
                window.location.search = r1;
            };
        }
        if (buttonR != null) {
            buttonR.onclick = function () {
                window.location.search = r2;
            };
        }

        document.body.onkeydown = function (e) {
            let n = e.code;

            if (n === "ArrowLeft" && buttonL != null) {
                buttonL.click();
            }
            if (n === "ArrowRight" && buttonR != null) {
                buttonR.click();
            }

        };
    }
})();
(function () {
    let bs = document.getElementsByClassName("image-box");
    for (let i = 0; i < bs.length; i++) {
        bs[i].onclick = function () {
            window.location.href = this.firstChild.src;
        }
    }
})();