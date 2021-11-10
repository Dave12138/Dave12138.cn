(function() {

    function showPagesDetail(strArr) {
        document.getElementById("PCBDetails").innerHTML = "<tr><th>逻辑号</th><th>内存物理页号</th><th>在内存中</th><th>访问字段</th><th>修改标志</th><th>外存物理页号</th></tr>" + strArr;
        hideControl('canvas');
    }

    function parseElement(str) {
        let o = document.createElement("table");
        o.innerHTML = str;
        return o.childNodes[0];
    }

    //全局更新ui

    function updateUI() {
        function updateTable(tableId, queue) {
            tableId.innerHTML = "<tr><th>进程名</th><th>大小</th><th>页表</th></tr>";
            for (let i = 0; i < queue.length; i++) {
                let line = "";
                if (queue[i] == null) continue;
                for (let j = 0; j < queue[i].pages.length; j++) {
                    line += `<tr><td>${j}</td>${queue[i].pages[j]}</tr>`;
                }
                let nonod = parseElement(`<tr><td>${queue[i].processName}</td><td>${queue[i].usedSize}</td><td>详细</td></tr>`);
                tableId.append(nonod);
                nonod.lastElementChild.onclick = function() {
                    showPagesDetail(line);
                };
            }

        }

        (function updateFinishTable(queue) {
            let tableId = $("#finishTable")[0];
            tableId.innerHTML = "<tr><th>进程名</th><th>到达时刻</th><th>所需时间</th><th>结束时刻</th></tr>";
            for (let i = 0; i < queue.length; i++) {

                let nonod = parseElement(`<tr><td>${queue[i].processName}</td><td>${queue[i].timeCreate}</td><td>${queue[i].timeNeed}</td><td>${queue[i].timeFinish}</td></tr>`);
                tableId.append(nonod);
                nonod.onclick = function() {
                    log2.value = `T=${queue[i].T}\nW=${queue[i].W}`;

                };
            }

        })(finishArray);

        updateTable(readyTable, readyQueue);
        updateTable(blockTable, blockQueue);
        updateTable(CPUTable, [CPU]);

        let tm = "<tbody>";
        for (let i = 0; i < memoryStatus.maxPages; i++) {
            if (i % 16 === 0) {
                if (i > 0)
                    tm += "</td></tr>";
                tm += "<tr><td>";
            } else if (i % 8 === 0) {

                tm += "</td><td>";
            }
            tm += memoryStatus.valueAt(i) ? 1 : 0;
        }

        tm += "</td></tr></tbody>";
        memBitMapTable.innerHTML = tm;
    }


    class Page {
        addr; //这里是编号而不是准确地址
        inMem; //是否在物理内存中
        accessMark; //访问字段，根据全局设置调整排序策略
        isChanged; //是否被修改
        ssdAddr; //这里是编号而不是准确地址，本属性是指外存
        constructor(ssdAddr) {
            this.ssdAddr = ssdAddr;
            this.addr = null;
            this.inMem = false;
            this.accessMark = null;
            this.isChanged = false;
        }

        toString() {
            return `<td>${this.addr}</td><td>${this.inMem}</td><td>${this.accessMark}</td><td>${this.isChanged}</td><td>${this.ssdAddr}</td>`;
        }
    }

    class PCB {
        processName;
        pages;
        usedSize;
        activePageLimit;
        pageLostTimes;
        accessTimes;

        timeCreate;
        timeNeed;
        timeFinish;
        timeInCPU;

        constructor(processName, sizeUsed, timeNeed) {
            this.processName = processName;
            this.usedSize = sizeUsed;
            this.pages = new Array(Math.ceil(sizeUsed / chunkSize));
            this.activePageLimit = 6 < this.pages.length ? 6 : this.pages.length;
            this.pageLostTimes = 0;
            this.accessTimes = 0;
            this.timeCreate = systemTick;
            this.timeNeed = timeNeed;
            this.timeInCPU = 0;
        }

        get activePageCount() {
            let count1 = 0;
            for (let i = 0; i < this.pages.length; i++) {
                if (this.pages[i].inMem) {
                    count1++;
                }
            }
            return count1;
        }

        //根据访问字段确定将会被换出的页
        //理论上我应该用链表加工个动态排序队列实现，但想到和直接挨个数一样都是O(n)就放弃了
        get pageWillBeSwitchOut() {
            let s = -1;
            for (let i = 0; i < this.pages.length; i++) {
                if (this.pages[i].inMem) {
                    if (s < 0 || this.pages[i].accessMark < this.pages[s].accessMark) {
                        s = i;
                    }
                }
            }
            return s < 0 ? undefined : this.pages[s];
        }

        get pageLostProbability() {
            return this.pageLostTimes / this.accessTimes;
        }

        isShaking() {
            return this.accessTimes > 12 && this.pageLostProbability > 0.8 && this.activePageCount === this.activePageLimit;
        }

        access(addr) {
            if (addr >= this.usedSize) {
                return "越界中断";
            }
            let p = addr / chunkSize;
            p = p | 0;
            let q = addr % chunkSize;
            readPage(this.pages[p]);
            return this.pages[p].addr * chunkSize + q;
        }

        write(addr) {
            if (addr >= this.usedSize) {
                return "越界中断";
            }
            let p = addr / chunkSize;
            p = p | 0;
            let q = addr % chunkSize;
            readPage(this.pages[p]);
            this.pages[p].isChanged = true;
            return this.pages[p].addr * chunkSize + q;
        }

        run() {
            if (this.timeInCPU < this.timeNeed) {
                this.timeInCPU++;
            }
            if (this.timeNeed === this.timeInCPU) {
                this.timeFinish = systemTick;
            }
        }

        get finished() {
            return this.timeNeed <= this.timeInCPU;
        }

        get T() {
            return this.timeFinish - this.timeCreate;
        }

        get W() {
            return this.T / this.timeNeed;
        }
    }

    function CPUCheck() {

        if (CPU == null && readyQueue.length > 0) {
            CPU = readyQueue.shift();
            //CPU.access(0);
        }

    }


    function createNewPcb(form) {
        //新进程
        let tmp = new PCB(form.elements[0].value, form.elements[1].value | 0, form.elements[2].value | 0);
        if (tmp.usedSize < 1 || tmp.processName.length < 1) {
            log1.value = "需要输入完整进程信息";
            return;
        }
        //从外存中分配页给它
        for (let i = 0; i < tmp.pages.length; i++) {
            let r = ssdStatus.firstUnusedIndex();
            if (r !== undefined) {
                ssdStatus.changeValueAt(r);
                tmp.pages[i] = new Page(r);
            } else {
                //外存已满
                //回收所有分配给新进程的外存
                for (let j = 0; j < i; j++) {
                    ssdStatus.changeValueAt(tmp.pages[j].ssdAddr);
                }
                alert("外存不足，请求拒绝");
                return;
            }
        }
        //分配完外存后将其加入就绪队列
        if (taskPlan === 0) {
            readyQueue.push(tmp);
        } else if (taskPlan === 2) {
            readyQueue.unshift(tmp);
        } else {
            let i = 0;
            for (; i < readyQueue.length; i++) {
                if (readyQueue[i].timeNeed >= tmp.timeNeed) {
                    break;
                }
            }
            readyQueue.splice(i, 0, tmp);
        }
    }


    //全部物理内存回收
    function recyclePages(pages) {
        for (let i = 0; i < pages.length; i++) {
            recyclePage(pages[i]);
        }

    }

    //换出或回收某物理内存中页，返回腾出来的内存块
    function recyclePage(page) {
        if (page.inMem) {
            if (page.isChanged) {
                log1.value += `物理内存块${page.addr}写回外存块${page.ssdAddr}\n`;
                page.isChanged = false;
            }
            log1.value += `回收物理内存块${page.addr}\n`;
            memoryStatus.changeValueAt(page.addr);
            page.inMem = false;
            let st = page.addr;
            page.addr = null;
            page.accessMark = null;
            return st;
        }
        return undefined;
    }

    //全局换出，返回腾出来的物理内存
    function systemSwitchOut() {
        let x = null;
        for (let i = 0; i < blockQueue.length; i++) {
            let l = blockQueue[i].pageWillBeSwitchOut;
            if (l !== undefined) {
                if (null == x || x.accessMark > l.accessMark) {
                    x = l;
                }
            }
        }
        for (let i = 0; i < readyQueue.length; i++) {
            let l = readyQueue[i].pageWillBeSwitchOut;
            if (l !== undefined) {
                if (null == x || x.accessMark > l.accessMark) {
                    x = l;
                }
            }
        }
        return x != null ? recyclePage(x) : undefined;

    }

    //回收外存
    function recycleSSDPages(pages) {
        for (let i = 0; i < pages.length; i++) {
            recycleSSDPage(pages[i]);
        }

    }

    function recycleSSDPage(page) {
        if (page.inMem) {
            alert("调试信息：调用顺序错误");
        }
        log1.value += `回收外存块${page.ssdAddr}\n`;
        ssdStatus.changeValueAt(page.ssdAddr);

    }

    //换入页
    function switchInPage(page) {
        if (page.inMem) {
            alert("调试信息:ERROR");
            return;
        }
        let k = undefined;
        if (CPU.activePageCount < CPU.activePageLimit) {
            k = memoryStatus.firstUnusedIndex();
        }
        if (k === undefined) {
            k = recyclePage(CPU.pageWillBeSwitchOut);

        }
        if (k === undefined) {
            k = systemSwitchOut();
        }
        if (k === undefined) {
            alert("调试信息：内存过小");
            exit(-1);
        }
        memoryStatus.changeValueAt(k);
        page.addr = k;
        log1.value += `从外存块${page.ssdAddr}换入到物理内存块${page.addr}\n`;

        page.inMem = true;
        page.isChanged = false;


    }

    function readPage(page) {
        if (!page.inMem) {
            switchInPage(page);
            CPU.pageLostTimes++;
            page.accessMark = new Date().getTime();
            if (CPU.isShaking()) {
                CPU.activePageLimit++;
            }
        }
        if (switchPlan === 1) {
            page.accessMark = new Date().getTime();
        }
        CPU.accessTimes++;
        log1.value += `读取物理内存块${page.addr}\n`

    }

    //bitmap应记录内存中页的使用状况
    //写都写了，外存使用状况也用它记吧
    class BitMap {
        maxPages;
        map;

        constructor(pageMaxLimit) {
            this.maxPages = pageMaxLimit;
            this.map = new Array(Math.ceil(pageMaxLimit / 32));
            for (let i = 0; i < this.map.length; i++) {
                this.map[i] = 0;
            }
        };

        valueAt(index) {
            if (index > this.maxPages) {
                return undefined;
            }
            return (this.map[(index / 32) | 0] & mapDic[index % 32]) !== 0;

        }

        changeValueAt(index) {
            if (index >= this.maxPages) {
                return undefined;
            }
            this.map[(index / 32) | 0] ^= mapDic[index % 32];
            return (this.map[(index / 32) | 0] & mapDic[index % 32]) > 0;
        }

        firstUnusedIndex() {
            let a = this.__firstUnusedIndex();
            return a < this.maxPages ? a : undefined;
        }

        __firstUnusedIndex() {
            for (let i = 0; i < this.map.length; i++) {
                if (this.map[i] !== -1) {
                    for (let j = 0; j < 32; j++) {
                        if ((this.map[i] & mapDic[j]) === 0) {
                            return i * 32 + j;
                        }
                    }
                }
            }
            return undefined;
        }
    }

    //UI
    let PCBCreateForm;
    let CPUTable;
    let blockTable;
    let readyTable;
    let systemOption;
    let log1;
    let log2;
    let logicAddrInput;
    let memBitMapTable;
    //实验1
    let CPU = null;
    let readyQueue;
    let blockQueue;
    //实验2
    let memoryStatus; //内存分配情况
    let ssdStatus; //外存分配情况
    let chunkSize; //块（页）大小，int
    let mapDic = []; //位操作辅助字典

    /**
     * 0:FIFO先进先出
     * 1:LRU喜新厌旧
     */
    let switchPlan = 0;
    //实验4
    /**
     * 0:FCFS
     * 1:SJF短作业优先
     * 2:时间片轮转
     * */
    let taskPlan = 0;
    let systemTick = 0;
    let finishArray;
    //初始化
    (function() {
        //抓取UI
        PCBCreateForm = document.getElementById("PCBCreateForm");
        CPUTable = document.getElementById("CPUTable");
        blockTable = document.getElementById("blockTable");
        readyTable = document.getElementById("readyTable");
        systemOption = document.getElementById("systemOption");
        log1 = document.getElementById("log1");
        log2 = $("#log2")[0];
        logicAddrInput = document.getElementById("logicAddrInput");
        memBitMapTable = document.getElementById("memBitMapTable");

        $("#onProgressCreateButton")[0].onclick = function() {
            onProgressCreateButton();
            return false;
        };

        $("#onProgressBlockButton")[0].onclick = onProgressBlockButton;
        $("#onProgressEndButton")[0].onclick = onProgressEndButton;
        $("#onTansAddr")[0].onclick = onTansAddr;
        $("#onTansAddrWithWrite")[0].onclick = onTansAddrWithWrite;
        $("#pageLostProbability")[0].onclick = function() {
            $("#tempOut1")[0].value = CPU.pageLostProbability;
        };
        $("#sysTickAdd")[0].onclick = (function() {
            sysTickGo();
            updateUI();
        });
        $("#averageT")[0].onclick = function() {
            let aT = 0;
            let aW = 0;
            let n = finishArray.length;
            for (let i = 0; i < finishArray.length; i++) {
                aT += finishArray[i].T;
                aW += finishArray[i].W;
            }
            log2.value = `T=${aT / n}\nW=${aW / n}`;
        };
        //从request导入全局设置
        let reqs = window.location.search.split('&');
        for (let i = 0; i < reqs.length; i++) {
            if (/^systemMemSize=(.*)$/.test(reqs[i])) {
                systemOption.elements[0].value = RegExp.$1;
            }
            if (/^systemChunkSize=(.*)$/.test(reqs[i])) {
                systemOption.elements[1].value = RegExp.$1;
            }
            if (/^systemHardDriveSize=(.*)$/.test(reqs[i])) {
                systemOption.elements[2].value = RegExp.$1;
            }
            if (/^switchType=(.*)$/.test(reqs[i])) {
                document.getElementsByName("switchType")[RegExp.$1 ^ 1].checked = null;
                document.getElementsByName("switchType")[RegExp.$1].checked = "checked";
                switchPlan = RegExp.$1 | 0;
            }
            if (/^taskType=(.*)$/.test(reqs[i])) {
                taskPlan = RegExp.$1 | 0;
                for (let j = 0; j < 3; j++)
                    $(`#taskType${j + 1}`)[0].checked = (j === taskPlan) ? "checked" : null;
            }
        }
        //凑整
        (function() {
            systemOption.elements[0].value = Math.ceil(systemOption.elements[0].value / (systemOption.elements[1].value)) * systemOption.elements[1].value;
            systemOption.elements[2].value = Math.ceil(systemOption.elements[2].value / (systemOption.elements[1].value)) * systemOption.elements[1].value;
        })();
        //检查参数合法性
        (function() {
            //true:s是32位正整数或整数字符串
            function foo(s) {
                return s / 1 === (s | 0) && s > 0;
            }

            //true:s是1或0,不能是字符串
            function fee(s) {
                return ((s & 1) === s);
            }

            //清空设置
            function crash(s = "") {
                alert("全局设置不符合规范  " + s);
                window.location.search = "";
                exit(-1);
            }

            if (!foo(systemOption.elements[0].value) || !foo(systemOption.elements[1].value) || !foo(systemOption.elements[2].value) || !fee(switchPlan)) {
                crash();
            }
            if ((0 | systemOption.elements[0].value) < systemOption.elements[1].value || (0 | systemOption.elements[2].value) < systemOption.elements[1].value) {
                crash("内存或外存小于块大小");
            }
            if (Math.floor(systemOption.elements[2].value / systemOption.elements[1].value) < 6 || Math.floor(systemOption.elements[0].value / systemOption.elements[1].value) < 6) {
                crash("内存/外存大小不足六倍页大小")
            }
        })();
        //就绪、阻塞队列
        readyQueue = [];
        blockQueue = [];
        finishArray = [];
        //初始化bitmap
        memoryStatus = new BitMap(Math.floor(systemOption.elements[0].value / systemOption.elements[1].value));
        ssdStatus = new BitMap(Math.floor(systemOption.elements[2].value / systemOption.elements[1].value));
        chunkSize = systemOption.elements[1].value | 0;
        for (let i = 31; i > -1; i--) {
            mapDic.push(1 << i);
        }
        updateUI();
    })();

    //响应
    function onProgressCreateButton() {
        log1.value = "";
        createNewPcb(PCBCreateForm);
        sysTickGo();
        CPUCheck();
        updateUI();
    }

    function onProgressBlockButton() {
        log1.value = "";
        if (CPU != null) {
            blockQueue.push(CPU);
            CPU = null;
        }
        CPUCheck();
        updateUI();
    }

    function onProgressEndButton() {
        log1.value = "";
        if (CPU != null) {
            recyclePages(CPU.pages);
            recycleSSDPages(CPU.pages);
            CPU = null;
        }
        CPUCheck();
        updateUI();
    }

    function onTansAddr() {
        log1.value = "";
        let x = CPU.access(logicAddrInput.value | 0);
        document.getElementById("tempOut1").value = x;

        CPUCheck();
        updateUI();
    }

    function onTansAddrWithWrite() {
        log1.value = "";

        document.getElementById("tempOut1").value = CPU.write(logicAddrInput.value | 0);

        CPUCheck();
        updateUI();
    }

    function sysTickGo() {
        log2.value = `时刻：${systemTick}\n`;
        if (CPU != null) {
            CPU.run();
            log2.value += `${CPU.processName} 运行\n`;
            if (CPU.finished) {
                recyclePages(CPU.pages);
                recycleSSDPages(CPU.pages);
                finishArray.push(CPU);
                log2.value += `${CPU.processName} 结束\n`;
                CPU.pages = [];
                CPU = null;
            }
        }

        if (taskPlan === 2 && CPU != null) {
            readyQueue.push(CPU);
            CPU = null;
        }
        CPUCheck();
        systemTick++;
    }
})();