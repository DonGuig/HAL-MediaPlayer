import { useContext } from "react";
// import { Scrollbars } from 'react-custom-scrollbars-2';
import { SidebarContext } from "src/contexts/SidebarContext";

import { Box, Drawer, useMediaQuery } from "@mui/material";

import { styled } from "@mui/material/styles";
import SidebarMenu from "./SidebarMenu";
import Logo from "src/components/Logo";

const SidebarWrapper = styled(Box)(
  ({ theme }) => `
        width: ${theme.sidebar.width};
        color: ${theme.sidebar.textColor};
        background: ${theme.sidebar.background};
        box-shadow: ${theme.sidebar.boxShadow};
        height: 100%;
        
        @media (min-width: ${theme.breakpoints.values.lg}px) {
            position: fixed;
            z-index: 10;
        }
`
);

const TopSection = styled(Box)(
  ({ theme }) => `
        margin: ${theme.spacing(2)};
        justify-content: "center";
        align-items: "center";
`
);

function Sidebar() {
  const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
  const closeSidebar = () => toggleSidebar();
  const hiddenLgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const hiddenLgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  return (
    <>
      {hiddenLgUp && (
        <SidebarWrapper>
          {/* <Scrollbars autoHide> */}
          <TopSection>
            <Logo />
          </TopSection>
          <SidebarMenu />
          {/* </Scrollbars> */}
        </SidebarWrapper>
      )}
      {hiddenLgDown && (
        <Drawer
          anchor="left"
          open={sidebarToggle}
          onClose={closeSidebar}
          variant="temporary"
          elevation={9}
        >
          <SidebarWrapper>
            {/* <Scrollbars autoHide> */}
            <TopSection>
              {/* <Box sx={{ width: 52, ml: 1, mt: 1, mb: 3 }}> */}
              <Logo />
              {/* </Box> */}
            </TopSection>
            <SidebarMenu />
            {/* </Scrollbars> */}
          </SidebarWrapper>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
