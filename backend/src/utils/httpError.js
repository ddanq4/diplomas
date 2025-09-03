export function httpError(status, message = 'Error', errors) {
    const e = new Error(message);
    e.status = status;
    if (errors && typeof errors === 'object') e.errors = errors;
    return e;
}
