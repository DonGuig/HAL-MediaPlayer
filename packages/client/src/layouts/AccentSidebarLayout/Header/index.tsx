import { useContext } from "react";

import { Box, Hidden, IconButton, Tooltip, Grid, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import MenuTwoToneIcon from "@mui/icons-material/MenuTwoTone";
import { SidebarContext } from "src/contexts/SidebarContext";
import CloseTwoToneIcon from "@mui/icons-material/CloseTwoTone";

import Name from "./Name";

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
        height: ${theme.header.height};
        color: ${theme.header.textColor};
        padding: ${theme.spacing(0, 2)};
        right: 0;
        z-index: 5;
        background-color: ${theme.header.background};
        box-shadow: ${theme.header.boxShadow};
        position: fixed;
        justify-content: center;
        align-items: flex-end;
        flex-direction: column;
        width: 100%;
        @media (min-width: ${theme.breakpoints.values.lg}px) {
            left: ${theme.sidebar.width};
            width: auto;
        }
`
);

function Header() {
  const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);

  return (
    <HeaderWrapper display="flex">
      <Grid
        container
        alignItems="center"
        width="100%"
        justifyContent="space-between"
      >
        <Grid item>
          <Stack direction="row" spacing={1}>
            <Hidden lgUp>
              <Tooltip arrow title="Toggle Menu">
                <IconButton color="primary" onClick={toggleSidebar}>
                  {!sidebarToggle ? <MenuTwoToneIcon /> : <CloseTwoToneIcon />}
                </IconButton>
              </Tooltip>
            </Hidden>
          </Stack>
        </Grid>
        <Grid item>
            <Name />
        </Grid>
        <Grid item/>
      </Grid>
    </HeaderWrapper>
  );
}

export default Header;
