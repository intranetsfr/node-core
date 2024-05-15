class Texts{
    p(content:RichText="My content", align=['', 'center', 'right', 'left']){
        return `<p class="${align}">${content}</p>`;
    }
    span(content:string){
        return `<span>${content}</span>`;
    }
    article(content:string){
        return `<article>${content}</article>`;
    }
}
module.exports = Texts;