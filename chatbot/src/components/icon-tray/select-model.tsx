import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import PersonIcon from '@mui/icons-material/Person';
import { models } from "./models";

export interface SelectModelProps {
    setModel: (model: any) => void;
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    background: 'white',
    padding: "32px",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
}

export const SelectModel = ({
    setModel,
}: SelectModelProps) => {
    const [open, setOpen] = useState<boolean>(true);
    return (
        <>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                sx={{ zIndex: 2000 }}
            >
                <div style={modalStyle}>
                    <Typography variant="h4" component="h2">
                        Select Avatar
                    </Typography>
                    <ImageList sx={{ width: 500, height: 300 }} cols={2} rowHeight={250}>
                        {models.map((model) => (
                            <ImageListItem key={model.name}>
                                <div style={{ width: "100%", height: "100%"}}>   
                                    <img
                                        src={`${model.thumbnail}`}
                                        alt={model.name}
                                        loading="lazy"
                                        onClick={() => {
                                            setModel(model);
                                            setOpen(false);
                                        }}
                                        style={{ cursor: "pointer", width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                    />
                                    <span style={{ display: "block", textAlign: "center", lineHeight: "2" }}>{model.text}</span>
                                </div>
                            </ImageListItem>
                        ))}
                    </ImageList>
                </div>
            </Modal>
            <IconButton
                style={{
                    background: "#7070ff",
                    color: "white",
                    borderRadius: "100px",
                    padding: 16,
                    height: "2em",
                    width: "2em",
                    boxShadow:
                        "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)",
                }}
                onClick={() => setOpen(true)}
            >
                <PersonIcon
                    style={{
                        height: "1.3em",
                        width: "1.3em",
                    }}
                />
            </IconButton>
        </>
    );
}