const ipcRenderer = window.EDCarnage.ipcRenderer;
const hbsMain = window.EDCarnage.hbsMain;

let detail;

function setDetail(detailButton) {
    for (const lvl of [1, 2, 3]) {
        $(`#lvl${lvl}`).removeClass('active');
        if (lvl <= detailButton) $(`.lvl${lvl}`).show();
        else $(`.lvl${lvl}`).hide();
    }
    $(`#lvl${detailButton}`).addClass('active');
    detail = detailButton;
}

function loadData() {
    const data = ipcRenderer.sendSync('request-data', 'journal');
    $('body').html(hbsMain(data));
    setDetail(detail);

    for (const detailButton of [1, 2, 3]) {
        $(`#lvl${detailButton}`).on('click', () => setDetail(detailButton));
    }
}

$(function () {
    detail = 2;
    setInterval(loadData, 5 * 1000);
    loadData();
});
