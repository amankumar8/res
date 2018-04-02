export function parseProperty(object, accessor) {
    let remains = accessor;
    let result = Object.assign({}, object);
    while(remains.length > 0) {
        const dotIndex = remains.indexOf('.');
        const parenthesisIndex = remains.indexOf('[');
        if(dotIndex > -1 && parenthesisIndex === -1) {
            result = result[remains.substring(0, dotIndex)];
            remains = remains.substring(dotIndex + 1);
        } else if(dotIndex > -1 && parenthesisIndex > -1 && dotIndex < parenthesisIndex) {
            result = result[remains.substring(0, dotIndex)];
            remains = remains.substring(dotIndex + 1);
        } else if(dotIndex === -1 && parenthesisIndex > -1) {
            const preParenthesis = remains.substring(0, parenthesisIndex);
            if(preParenthesis.length > 0) {
                result = result[remains.substring(0, parenthesisIndex)];
            }
            if(result instanceof Array) {
                remains = remains.substring(parenthesisIndex + 2);
                const closeParenthesisIndex = remains.indexOf(']');
                result = result[remains.substring(0, closeParenthesisIndex)];
                remains = remains.substring(parenthesisIndex + 2);
                if(remains[0] === '.') {
                    remains = remains.substring(1);
                }
            } else {
                throw `Invalid accessor ${accessor}`;
            }
        } else if(dotIndex > -1 && parenthesisIndex > -1 && parenthesisIndex < dotIndex) {
            const preParenthesis = remains.substring(0, parenthesisIndex);
            if(preParenthesis.length > 0) {
                result = result[remains.substring(0, parenthesisIndex)];
            }
            if(result instanceof Array) {
                remains = remains.substring(parenthesisIndex + 1);
                const closeParenthesisIndex = remains.indexOf(']');
                result = result[remains.substring(0, closeParenthesisIndex)];
                remains = remains.substring(closeParenthesisIndex + 2);
                if(remains[0] === '.') {
                    remains = remains.substring(1);
                }
            } else {
                throw `Invalid accessor ${accessor}`;
            }
        } else if(dotIndex === parenthesisIndex && remains.length > 0) {
            result = result[remains];
            remains = "";
        } else {
            throw "Should not be thrown";
        }
    }
    return result;
}

/*
console.log('parsePropertyTest');
console.log(parseProperty({a: 1}, 'a'), '1');
console.log(parseProperty({a: {b: 8}}, 'a.b'), '8');
console.log(parseProperty({emails: [{address: 'some address'}]}, 'emails[0].address'), 'some address');*/
