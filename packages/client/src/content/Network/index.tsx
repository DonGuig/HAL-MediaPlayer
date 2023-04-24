import * as React from 'react';
import {
    Container, Divider,
} from "@mui/material";
import WiredEthernet from './WiredEthernet';
import Hostname from './Hostname';
import Wifi from './Wifi';



const Network: React.FC = () => {
    return (
        <Container>
            <WiredEthernet/>
            <Divider/>
            <Wifi/>
            <Divider/>
            <Hostname/>
        </Container>
    );
};


export default Network;