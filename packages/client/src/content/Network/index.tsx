import * as React from 'react';
import {
    Button,
    Container, Divider, Typography,
} from "@mui/material";
import axiosServerAPI from 'src/utils/axios';
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