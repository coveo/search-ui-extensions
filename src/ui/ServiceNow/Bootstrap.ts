import { AttachToCaseEndpointSN } from "../AttachToCase/AttachToCaseEndpointSN";

export class Bootstrap {
    constructor() {
        this.bootstrap();
    }

    private bootstrap() {
        window['attachToCaseEndpoint'] = new AttachToCaseEndpointSN();
    }
}

new Bootstrap();
