import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse, notification, Input, message } from 'antd';
import uuid from 'uuid/v4';
import classnames from 'classnames';
import i18n from 'i18next';
import   './style.css'
import Row from 'react-bootstrap/Row'


import { FlexBox } from '../flex';
import Icon from '../icon/Icon';
import Scrollbar from '../common/Scrollbar';
import CommonButton from '../common/CommonButton';
import { SVGModal } from '../common';
import ColorPicker from "../common/ColorPicker";
import ColorPickerNew from "../common/ColorPickerNew";

notification.config({
    top: 80,
    duration: 2,
});

class ImageMapItems extends Component {


    constructor(props){
        super(props);

    }
    static propTypes = {
        canvasRef: PropTypes.any,
        descriptors: PropTypes.object,
    }

    state = {
        activeKey: [],
        collapse: false,
        textSearch: '',
        descriptors: {},
        filteredDescriptors: [],
        svgModalVisible: false,
        template : [],
        fonts : [],
        backgrounds : []
    }

    componentDidMount() {
        let template = [
            {
                "source" : "http://localhost/canva-editor/public/images/sample/mother_day.png",
                "name" : "mother_day.json",
                "type" : "template"
            },
            {
                "source" : "http://localhost/canva-editor/public/images/sample/reactjs.png",
                "name" : "reactjs.json",
                "type" : "template"
            }

        ]
        let fonts = [
            {
                "source" : "http://localhost/canva-editor/public/images/fonts/playfair.png",
                "name" : "playfair.json",
                "type" : "fonts"
            },
            {
                "source" : "http://localhost/canva-editor/public/images/fonts/robotto.png",
                "name" : "robotto.json",
                "type" : "fonts"
            }
        ]
        let background = [
            {
                "source" : "http://localhost/canva-editor/public/images/background/blue-screen.png",
                "name" : "screen-background-blue.json",
                "type" : "background"
            },
            {
                "source" : "http://localhost/canva-editor/public/images/background/blue-screen-dark.png",
                "name" : "screen-background-blue-dark.json",
                "type" : "background"
            },
        ]

        // fetch(  'http://frontend.youchug.com/api/template').then(res => res.json()).then(data => {
        //     this.setState({template: data.data})
        // }).then(console.log);


        this.setState({template: template})
        this.setState({fonts: fonts})
        this.setState({backgrounds: background})


        const { canvasRef } = this.props;
        this.waitForCanvasRender(canvasRef);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (JSON.stringify(this.props.descriptors) !== JSON.stringify(nextProps.descriptors)) {
            const descriptors = Object.keys(nextProps.descriptors).reduce((prev, key) => {
                return prev.concat(nextProps.descriptors[key]);
            }, []);
            this.setState({
                descriptors,
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (JSON.stringify(this.state.descriptors) !== JSON.stringify(nextState.descriptors)) {
            return true;
        } else if (JSON.stringify(this.state.filteredDescriptors) !== JSON.stringify(nextState.filteredDescriptors)) {
            return true;
        } else if (this.state.textSearch !== nextState.textSearch) {
            return true;
        } else if (JSON.stringify(this.state.activeKey) !== JSON.stringify(nextState.activeKey)) {
            return true;
        } else if (this.state.collapse !== nextState.collapse) {
            return true;
        } else if (this.state.svgModalVisible !== nextState.svgModalVisible) {
            return true;
        }
        return false;
    }

    componentWillUnmount() {
        const { canvasRef } = this.props;
        this.detachEventListener(canvasRef);
    }

    waitForCanvasRender = (canvas) => {
        setTimeout(() => {
            if (canvas) {
                this.attachEventListener(canvas);
                return;
            }
            const { canvasRef } = this.props;
            this.waitForCanvasRender(canvasRef);
        }, 5);
    };

    attachEventListener = (canvas) => {
        canvas.canvas.wrapperEl.addEventListener('dragenter', this.events.onDragEnter, false);
        canvas.canvas.wrapperEl.addEventListener('dragover', this.events.onDragOver, false);
        canvas.canvas.wrapperEl.addEventListener('dragleave', this.events.onDragLeave, false);
        canvas.canvas.wrapperEl.addEventListener('drop', this.events.onDrop, false);
    }

    detachEventListener = (canvas) => {
        canvas.canvas.wrapperEl.removeEventListener('dragenter', this.events.onDragEnter);
        canvas.canvas.wrapperEl.removeEventListener('dragover', this.events.onDragOver);
        canvas.canvas.wrapperEl.removeEventListener('dragleave', this.events.onDragLeave);
        canvas.canvas.wrapperEl.removeEventListener('drop', this.events.onDrop);
    }

    /* eslint-disable react/sort-comp, react/prop-types */
    handlers = {
        onAddTemplate: (item) => {
            const { canvasRef } = this.props;
            if (item.type === 'template') {
                canvasRef.handlers.clear();
            }

            import('./json/'+item.name).then((data) => {
                canvasRef.handlers.importJSON(JSON.stringify(data.objects), item.type);
            });
        },

        onAddItem: (item, centered) => {
            const { canvasRef } = this.props;
            if (canvasRef.workarea.layout === 'responsive') {
                if (!canvasRef.workarea.isElement) {
                    notification.warn({
                        message: 'Please your select background image',
                    });
                    return;
                }
            }
            if (canvasRef.interactionMode === 'polygon') {
                message.info('Already drawing');
                return;
            }
            const id = uuid();
            const option = Object.assign({}, item.option, { id });
            if (item.option.type === 'svg' && item.type === 'default') {
                this.handlers.onSVGModalVisible(item.option);
                return;
            }
            canvasRef.handlers.add(option, centered);
        },
        onAddSVG: (option, centered) => {
            const { canvasRef } = this.props;
            canvasRef.handlers.add({ ...option, type: 'svg', id: uuid(), name: 'New SVG' }, centered);
            this.handlers.onSVGModalVisible();
        },
        onDrawingItem: (item) => {
            const { canvasRef } = this.props;
            if (canvasRef.workarea.layout === 'responsive') {
                if (!canvasRef.workarea.isElement) {
                    notification.warn({
                        message: 'Please your select background image',
                    });
                    return;
                }
            }
            if (canvasRef.interactionMode === 'polygon') {
                message.info('Already drawing');
                return;
            }
            if (item.option.type === 'line') {
                canvasRef.drawingHandlers.line.init();
            } else if (item.option.type === 'arrow') {
                canvasRef.drawingHandlers.arrow.init();
            } else {
                canvasRef.drawingHandlers.polygon.init();
            }
        },
        onChangeActiveKey: (activeKey) => {
            this.setState({
                activeKey,
            });
        },
        onCollapse: () => {
            this.setState({
                collapse: !this.state.collapse,
            });
        },
        onSearchNode: (e) => {
            const filteredDescriptors = this.handlers.transformList().filter(descriptor => descriptor.name.toLowerCase().includes(e.target.value.toLowerCase()));
            this.setState({
                textSearch: e.target.value,
                filteredDescriptors,
            });
        },
        transformList: () => {
            return Object.values(this.props.descriptors).reduce((prev, curr) => prev.concat(curr), []);
        },
        onSVGModalVisible: () => {
            this.setState((prevState) => {
                return {
                    svgModalVisible: !prevState.svgModalVisible,
                };
            });
        },
    }

    events = {
        onDragStart: (e, item) => {
            this.item = item;
            const { target } = e;
            target.classList.add('dragging');
        },
        onDragOver: (e) => {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'copy';
            return false;
        },
        onDragEnter: (e) => {
            const { target } = e;
            target.classList.add('over');
        },
        onDragLeave: (e) => {
            const { target } = e;
            target.classList.remove('over');
        },
        onDrop: (e) => {
            e = e || window.event;
            if (e.preventDefault) {
                e.preventDefault();
            }
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            const { layerX, layerY } = e;
            const dt = e.dataTransfer;
            if (dt.types.length && dt.types[0] === 'Files') {
                const { files } = dt;
                Array.from(files).forEach((file) => {
                    file.uid = uuid();
                    const { type } = file;
                    if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') {
                        const item = {
                            option: {
                                type: 'image',
                                file,
                                left: layerX,
                                top: layerY,
                            },
                        };
                        this.handlers.onAddItem(item, false);
                    } else {
                        notification.warn({
                            message: 'Not supported file type',
                        });
                    }
                });
                return false;
            }

            if (this.item.type === 'template' || this.item.type === 'fonts' || this.item.type === 'background') {
                this.handlers.onAddTemplate(this.item);
            } else {
                const option = Object.assign({}, this.item.option, { left: layerX, top: layerY });
                const newItem = Object.assign({}, this.item, { option });
                this.handlers.onAddItem(newItem, false);
            }
            return false;
        },
        onDragEnd: (e) => {
            this.item = null;
            e.target.classList.remove('dragging');
        },
    }

    renderItems = items => (

        <div>
            <Row>
                {items.map(item => this.renderItem(item))}
            </Row>
        </div>
    )

    renderItem = (item, centered) => (
        item.type === 'drawing' ? (
            <div
                key={item.name}
                draggable
                onClick={e => this.handlers.onDrawingItem(item)}
                className="col-md-12 rde-editor-items-item"
                style={{ justifyContent: this.state.collapse ? 'center' : null }}
            >
                <span className="rde-editor-items-item-icon">
                    <Icon name={item.icon.name} prefix={item.icon.prefix} style={item.icon.style} />
                </span>
                {
                    this.state.collapse ? null : (
                        <div className="rde-editor-items-item-text">
                            {item.name}
                        </div>
                    )
                }
            </div>
        ) :  item.type === 'template' ? (
            this.state.template.map((template)=>
                    <div
                        key={template}
                        className={"col-md-6 my-image-parent"}
                        draggable
                        onClick={e => this.handlers.onAddTemplate(template)}
                        onDragStart={e => this.events.onDragStart(e, template)}
                        onDragEnd={e => this.events.onDragEnd(e, template)}>
                        <div className="my-image bg1"  style={{backgroundImage: `url(${template.source})`}}></div>
                    </div>
            )
        ) :  item.type === 'font' ? (
                this.state.fonts.map((fonts)=>
                    <div
                        key={fonts}
                        className={"col-md-6 my-image-parent"}
                        draggable
                        onClick={e => this.handlers.onAddTemplate(fonts)}
                        onDragStart={e => this.events.onDragStart(e, fonts)}
                        onDragEnd={e => this.events.onDragEnd(e, fonts)}
                        style={{  justifyContent: this.state.collapse ? 'center' : null }}>
                        <div className="my-image bg1"  style={{backgroundImage: `url(${fonts.source})`}}></div>
                    </div>
            )
        ) :
            item.type === 'background' ? (
                <div>
                    <div className="col-md-12">
                        <ColorPickerNew canvasRef={this.props.canvasRef} />
                    </div>

                    { this.state.backgrounds.map((background)=>


                        <div
                            key={background}
                            className={"col-md-6 my-image-parent"}
                            draggable
                            onClick={e => this.handlers.onAddTemplate(background)}
                            onDragStart={e => this.events.onDragStart(e, background)}
                            onDragEnd={e => this.events.onDragEnd(e, background)}
                            style={{  justifyContent: this.state.collapse ? 'center' : null }}>
                            <div className="my-image bg1"  style={{backgroundImage: `url(${background.source})`}}></div>
                        </div>
            )}
                </div>
        ):
            (
            <div
                key={item.name}
                draggable
                onClick={e => this.handlers.onAddItem(item, centered)}
                onDragStart={e => this.events.onDragStart(e, item)}
                onDragEnd={e => this.events.onDragEnd(e, item)}
                className="col-md-12 rde-editor-items-item"
                style={{ justifyContent: this.state.collapse ? 'center' : null }}
            >
                <span className="rde-editor-items-item-icon">
                    <Icon name={item.icon.name} prefix={item.icon.prefix} style={item.icon.style} />
                </span>
                {
                    this.state.collapse ? null : (
                        <div className="rde-editor-items-item-text">
                            {item.name}
                        </div>
                    )
                }
            </div>
        )
    )


    render() {
        const { descriptors } = this.props;
        const {
            collapse,
            textSearch,
            filteredDescriptors,
            activeKey,
            svgModalVisible,
            svgOption,
        } = this.state;
        const className = classnames('rde-editor-items', {
            minimize: collapse,
        });
        return (
            <div className={className}>
                <FlexBox flex="1" flexDirection="column" style={{ height: '100%' }}>
                    <FlexBox justifyContent="center" alignItems="center" style={{ height: 40 }}>
                        <CommonButton
                            icon={collapse ? 'angle-double-right' : 'angle-double-left'}
                            shape="circle"
                            className="rde-action-btn"
                            style={{ margin: '0 4px' }}
                            onClick={this.handlers.onCollapse}
                        />
                        {
                            collapse ? null : (
                                <Input
                                    style={{ margin: '8px' }}
                                    placeholder={i18n.t('action.search-list')}
                                    onChange={this.handlers.onSearchNode}
                                    value={textSearch}
                                    allowClear
                                />
                            )
                        }
                    </FlexBox>
                    <Scrollbar>
                        <FlexBox flex="1" style={{ overflowY: 'hidden' }}>
                            {
                                (textSearch.length && this.renderItems(filteredDescriptors)) || (
                                    collapse ? (
                                        <FlexBox flexWrap="wrap" flexDirection="column" style={{ width: '100%' }} justifyContent="center">
                                            {
                                                this.handlers.transformList().map(item => (
                                                    this.renderItem(item)
                                                ))
                                            }
                                        </FlexBox>
                                    ) : (
                                        <Collapse style={{ width: '100%' }} bordered={false} activeKey={activeKey.length ? activeKey : Object.keys(descriptors)} onChange={this.handlers.onChangeActiveKey}>
                                            {
                                                Object.keys(descriptors).map(key => (
                                                    <Collapse.Panel key={key} header={key} showArrow={!collapse}>
                                                        {this.renderItems(descriptors[key])}
                                                    </Collapse.Panel>
                                                ))
                                            }
                                        </Collapse>
                                    )
                                )
                            }
                        </FlexBox>
                    </Scrollbar>
                </FlexBox>
                <SVGModal
                    visible={svgModalVisible}
                    onOk={this.handlers.onAddSVG}
                    onCancel={this.handlers.onSVGModalVisible}
                    option={svgOption}
                />
            </div>
        );
    }
}

export default ImageMapItems;
