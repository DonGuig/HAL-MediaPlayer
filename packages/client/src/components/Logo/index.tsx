import { Box, Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import HALL from "./logo.svg";

const LogoTextWrapper = styled(Box)(
  ({ theme }) => `
  color: ${theme.colors.alpha.white[70]};
  padding: ${theme.spacing(0, 1, 0, 1)};
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  font-weight: ${theme.typography.fontWeightBold};
`
);

const LogoText = styled(Box)(
  ({ theme }) => `
        font-size: ${theme.typography.pxToRem(24)};
        font-weight: ${theme.typography.fontWeightBold};
`
);

function Logo() {
  return (
    <>
      <Container sx={{width:"130px"}}>
        <img src={HALL} alt="HAL"></img>
      </Container>
      <LogoTextWrapper>
        <LogoText>HAL Media Player</LogoText>
      </LogoTextWrapper>
    </>
  );
}

export default Logo;
