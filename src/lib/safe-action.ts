import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

export const actionClient = createSafeActionClient({
    handleServerError: async (e) => {
        if (e instanceof ServerError) {
            return e.message;
        }
        return DEFAULT_SERVER_ERROR_MESSAGE;
    }
});


export class ServerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ServerError';
    }

}
