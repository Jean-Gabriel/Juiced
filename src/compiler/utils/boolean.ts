export const isBoolean = (raw: string): raw is 'true' | 'false' => {
    return raw === 'true' || raw === 'false';
};

export const parseBoolean = (raw: 'true' | 'false'): boolean => {
    if(raw === 'true') {
        return true;
    }

    return false;
};